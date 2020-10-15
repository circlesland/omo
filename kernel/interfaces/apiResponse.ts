import type { ServiceError } from "@textile/hub-grpc/hub_pb_service";

export interface ApiResponse {
    error: ServiceError | null;
    session: string | null;
}