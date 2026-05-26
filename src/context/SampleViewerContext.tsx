import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  atlasCaseToManifest,
  ensurePanTSAtlasLoaded,
  getAtlasCase,
  getCaseMetadata,
  loadPanTSCatalog,
  loadPanTSLocalAtlas,
  loadPanTSAtlasSummary,
  type PanTSAtlasSummary,
  type PanTSLocalAtlas,
  type PanTSCaseManifest,
  type PanTSCatalogCase,
} from "../data/pants-atlas";
import {
  DEFAULT_VISIBLE_LAYERS,
  defaultOpacityForLayer,
  getPresetLayers,
  type FocusPresetId,
} from "../data/pants-organ-layers";

function initLayerState(manifest: PanTSCaseManifest) {
  const available = manifest.availableOrgans;
  const fromPreset = getPresetLayers("pancreas_context", available);
  const fromDefault = DEFAULT_VISIBLE_LAYERS.filter((id) => available.includes(id));
  const organs =
    fromPreset.length > 0
      ? fromPreset
      : fromDefault.length > 0
        ? fromDefault
        : available.slice(0, 1);
  const opacities: Record<string, number> = {};
  for (const id of available) {
    opacities[id] = defaultOpacityForLayer(id);
  }
  return { organs, opacities };
}

type SampleViewerValue = {
  loading: boolean;
  localAtlas: PanTSLocalAtlas | null;
  summary: PanTSAtlasSummary | null;
  selectedCaseId: string;
  manifest: PanTSCaseManifest | null;
  catalogMeta: PanTSCatalogCase | null;
  sliceIndex: number;
  selectedOrgans: string[];
  layerOpacityById: Record<string, number>;
  globalOverlayOpacity: number;
  isPlaying: boolean;
  focusPreset: FocusPresetId;
  layersOpen: boolean;
  selectCase: (caseId: string) => void;
  setSliceIndex: (i: number) => void;
  setIsPlaying: (v: boolean) => void;
  setGlobalOverlayOpacity: (v: number) => void;
  setLayersOpen: (v: boolean) => void;
  toggleOrgan: (id: string) => void;
  toggleGroup: (layerIds: string[]) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  applyFocusPreset: (preset: FocusPresetId) => void;
  resetLayers: () => void;
  showAllLayers: () => void;
  hideAllLayers: () => void;
};

const SampleViewerContext = createContext<SampleViewerValue | null>(null);

export function SampleViewerProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [localAtlas, setLocalAtlas] = useState<PanTSLocalAtlas | null>(null);
  const [summary, setSummary] = useState<PanTSAtlasSummary | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [manifest, setManifest] = useState<PanTSCaseManifest | null>(null);
  const [catalogMeta, setCatalogMeta] = useState<PanTSCatalogCase | null>(null);
  const [sliceIndex, setSliceIndex] = useState(0);
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([]);
  const [layerOpacityById, setLayerOpacityById] = useState<Record<string, number>>({});
  const [globalOverlayOpacity, setGlobalOverlayOpacity] = useState(0.55);
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusPreset, setFocusPreset] = useState<FocusPresetId>("pancreas_context");
  const [layersOpen, setLayersOpen] = useState(false);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadCase = useCallback((caseId: string) => {
    const atlas = getAtlasCase(caseId);
    if (!atlas) return false;
    const m = atlasCaseToManifest(atlas);
    const { organs, opacities } = initLayerState(m);
    setSelectedCaseId(caseId);
    setManifest(m);
    setCatalogMeta(getCaseMetadata(caseId));
    setSliceIndex(Math.floor(m.sliceCount / 2));
    setSelectedOrgans(organs);
    setLayerOpacityById(opacities);
    setFocusPreset("pancreas_context");
    setIsPlaying(false);
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [, sum] = await Promise.all([
        ensurePanTSAtlasLoaded(),
        loadPanTSAtlasSummary(),
        loadPanTSCatalog(),
      ]);
      const local = await loadPanTSLocalAtlas();
      if (cancelled) return;
      setLocalAtlas(local);
      setSummary(sum);
      const first = local?.cases[0]?.caseId;
      if (first) loadCase(first);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCase]);

  useEffect(() => {
    if (!isPlaying || !manifest) {
      if (playTimer.current) clearInterval(playTimer.current);
      playTimer.current = null;
      return;
    }
    playTimer.current = setInterval(() => {
      setSliceIndex((prev) => {
        const max = Math.max(0, manifest.sliceCount - 1);
        return prev >= max ? 0 : prev + 1;
      });
    }, 300);
    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, [isPlaying, manifest]);

  const toggleOrgan = useCallback((organ: string) => {
    setSelectedOrgans((prev) =>
      prev.includes(organ) ? prev.filter((o) => o !== organ) : [...prev, organ]
    );
  }, []);

  const toggleGroup = useCallback((layerIds: string[]) => {
    setSelectedOrgans((prev) => {
      const allOn = layerIds.every((id) => prev.includes(id));
      if (allOn) return prev.filter((id) => !layerIds.includes(id));
      const next = new Set(prev);
      for (const id of layerIds) next.add(id);
      return [...next];
    });
  }, []);

  const setLayerOpacity = useCallback((id: string, opacity: number) => {
    setLayerOpacityById((prev) => ({ ...prev, [id]: opacity }));
  }, []);

  const applyFocusPreset = useCallback(
    (preset: FocusPresetId) => {
      setFocusPreset(preset);
      if (!manifest) return;
      const organs = getPresetLayers(preset, manifest.availableOrgans);
      setSelectedOrgans(
        organs.length > 0 ? organs : manifest.availableOrgans
      );
    },
    [manifest]
  );

  const resetLayers = useCallback(() => {
    if (!manifest) return;
    const { organs, opacities } = initLayerState(manifest);
    setSelectedOrgans(organs);
    setLayerOpacityById(opacities);
    setFocusPreset("pancreas_context");
  }, [manifest]);

  const showAllLayers = useCallback(() => {
    if (!manifest) return;
    setSelectedOrgans([...manifest.availableOrgans]);
  }, [manifest]);

  const hideAllLayers = useCallback(() => {
    setSelectedOrgans([]);
  }, []);

  const value = useMemo(
    (): SampleViewerValue => ({
      loading,
      localAtlas,
      summary,
      selectedCaseId,
      manifest,
      catalogMeta,
      sliceIndex,
      selectedOrgans,
      layerOpacityById,
      globalOverlayOpacity,
      isPlaying,
      focusPreset,
      layersOpen,
      selectCase: loadCase,
      setSliceIndex,
      setIsPlaying,
      setGlobalOverlayOpacity,
      setLayersOpen,
      toggleOrgan,
      toggleGroup,
      setLayerOpacity,
      applyFocusPreset,
      resetLayers,
      showAllLayers,
      hideAllLayers,
    }),
    [
      loading,
      localAtlas,
      summary,
      selectedCaseId,
      manifest,
      catalogMeta,
      sliceIndex,
      selectedOrgans,
      layerOpacityById,
      globalOverlayOpacity,
      isPlaying,
      focusPreset,
      layersOpen,
      loadCase,
      toggleOrgan,
      toggleGroup,
      setLayerOpacity,
      applyFocusPreset,
      resetLayers,
      showAllLayers,
      hideAllLayers,
    ]
  );

  return (
    <SampleViewerContext.Provider value={value}>
      {children}
    </SampleViewerContext.Provider>
  );
}

export function useSampleViewer() {
  const ctx = useContext(SampleViewerContext);
  if (!ctx) throw new Error("useSampleViewer must be used within SampleViewerProvider");
  return ctx;
}
