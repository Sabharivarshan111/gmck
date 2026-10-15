import React from 'react';

/** Android-only surface. Web Vault navigation already opens the canonical
 * /simulator page; a browser preview must never impersonate native geometry.
 */
export default function LocalSimulator(): React.ReactElement | null {
  return null;
}
