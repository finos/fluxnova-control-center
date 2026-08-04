import { ThemeName } from '@fxn/types';
import { colors, ThemeColors } from './colors';

export interface BpmnColors {
  // Activities
  activityStroke: string;
  activityFill: string;
  // Events
  startEventStroke: string;
  startEventFill: string;
  endEventStroke: string;
  endEventFill: string;
  // Gateways
  gatewayStroke: string;
  gatewayFill: string;
  // Flows
  flowStroke: string;
  flowFill: string;
  // Markers
  flowEndMarkerStroke: string;
  flowEndMarkerFill: string;
  // Incidents
  incidentStroke: string;
  incidentFill: string;
  // Suspended
  suspendedFill: string;
  suspendedStroke: string;
  // Instances
  instanceStroke: string;
  instanceFill: string;
  // Tokens
  activeTokenFill: string;
  terminatedTokenFill: string;
  completedTokenFill: string;
  activeTokenStroke: string;
  terminatedTokenStroke: string;
  completedTokenStroke: string;
}

export function getBpmnColors(theme: ThemeName = 'default'): BpmnColors {
  const themeColors: ThemeColors = colors[theme];
  const fill = themeColors.light;
  return {
    activityStroke: themeColors.dark,
    activityFill: fill,
    startEventStroke: themeColors.dark,
    startEventFill: fill,
    endEventStroke: themeColors.dark,
    endEventFill: fill,
    gatewayStroke: themeColors.dark,
    gatewayFill: fill,
    flowStroke: themeColors.dark,
    flowFill: fill,
    flowEndMarkerStroke: themeColors.dark,
    flowEndMarkerFill: themeColors.dark,
    incidentStroke: themeColors.danger,
    incidentFill: themeColors.incidentHighlight,
    suspendedFill: themeColors.deployment,
    suspendedStroke: themeColors.suspendedTokenStroke,
    instanceStroke: themeColors.processInstanceHighlight,
    instanceFill: themeColors.processInstance,
    activeTokenFill: themeColors.activeTokenFill,
    terminatedTokenFill: themeColors.terminatedTokenFill,
    completedTokenFill: themeColors.completedTokenFill,
    activeTokenStroke: themeColors.activeTokenStroke,
    terminatedTokenStroke: themeColors.terminatedTokenStroke,
    completedTokenStroke: themeColors.completedTokenStroke,
  };
}
