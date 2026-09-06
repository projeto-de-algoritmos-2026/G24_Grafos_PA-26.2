export type ConnectionType = 'DOOR' | 'CORRIDOR' | 'STAIRCASE' | 'ELEVATOR';

export interface Connection {
  /** Unique connection id. */
  id: string;
  /** First connected environment id. */
  fromEnvironmentId: string;
  /** Second connected environment id. */
  toEnvironmentId: string;
  /** Distance in meters. */
  distanceMeters: number;
  /** Estimated crossing time in seconds. */
  traversalTimeSeconds: number;
  /** Risk level from 0 to 10. */
  riskLevel: number;
  /** Whether people with special accessibility needs can use it. */
  isAccessible: boolean;
  /** Connection category. */
  type: ConnectionType;
  /** Optional blocked flag for scenarios. */
  isBlocked?: boolean;
}
