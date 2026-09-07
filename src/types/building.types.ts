export type BuildingType = 'COMMERCIAL' | 'HOSPITAL' | 'SCHOOL' | 'RESIDENTIAL' | 'INDUSTRIAL';

export type EnvironmentType =
  | 'ROOM'
  | 'CORRIDOR'
  | 'STAIRCASE'
  | 'ELEVATOR'
  | 'BATHROOM'
  | 'EMERGENCY_EXIT'
  | 'MEETING_POINT';

export interface Position {
  /** Horizontal position in the floor plan. */
  x: number;
  /** Vertical position in the floor plan. */
  y: number;
}

export interface Occupancy {
  /** People without special accessibility needs. */
  regular: number;
  /** People who must use accessible routes. */
  pcd: number;
}

export interface Environment {
  /** Unique environment id. */
  id: string;
  /** Name shown to users. */
  name: string;
  /** Environment category. */
  type: EnvironmentType;
  /** Maximum safe capacity. */
  capacity: number;
  /** Whether the environment supports accessible evacuation. */
  isAccessible: boolean;
  /** People currently in the environment. */
  occupancy: Occupancy;
  /** Position inside the SVG plan. */
  position: Position;
  /** Optional blocked flag for scenarios. */
  isBlocked?: boolean;
}

export interface Floor {
  /** Unique floor id. */
  id: string;
  /** Floor number. */
  number: number;
  /** Human-readable floor name. */
  name: string;
  /** Environments placed on this floor. */
  environments: Environment[];
  /** Connections between environments. */
  connections: import('./connection.types').Connection[];
}

export interface Building {
  /** Unique building id. */
  id: string;
  /** Building name. */
  name: string;
  /** Business type of the building. */
  type: BuildingType;
  /** Optional management description. */
  description?: string;
  /** Floors registered for this building. */
  floors: Floor[];
  /** ISO 8601 creation date. */
  createdAt: string;
  /** ISO 8601 update date. */
  updatedAt: string;
}
