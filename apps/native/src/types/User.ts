export enum UserRole {
  PERSONNEL = "Personnel",
  VETERAN = "Veteran",
  FAMILY = "Family",
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  rank?: string;
  unit?: string;
  verified: boolean;
}
