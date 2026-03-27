// Used throughout instance CRUD to filter/create by owner (project OR inquiry)
export type InstanceOwner =
  | { project_id: number; inquiry_id?: undefined }
  | { inquiry_id: number; project_id?: undefined };
