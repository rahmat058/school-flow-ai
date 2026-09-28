import { SetMetadata } from '@nestjs/common';

export const RESOURCE_KEY = 'resource';

/**
 * Marks a controller as serving a REST resource, so the response interceptor
 * attaches `links` (`self`/`get`/`update`/`delete`) to a single-object response.
 */
export const Resource = (base: string) => SetMetadata(RESOURCE_KEY, base);
