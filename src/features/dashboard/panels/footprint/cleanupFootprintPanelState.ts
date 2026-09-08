import { cleanupMarketPanelState } from '../shared/settings/cleanupMarketPanelState';
import useFootprintSettingsStore from './useFootprintSettingsStore';

export const cleanupFootprintPanelState = (panelId: string): void => {
    cleanupMarketPanelState(panelId);
    useFootprintSettingsStore.getState().removeSettings(panelId);
};
