/*
 * Copyright 2009-2026 C3 AI (www.c3.ai). All Rights Reserved.
 * Confidential and Proprietary C3 Materials.
 * This material, including without limitation any software, is the confidential trade secret and proprietary
 * information of C3 and its licensors. Reproduction, use and/or distribution of this material in any form is
 * strictly prohibited except as set forth in a written license agreement with C3 and/or its authorized distributors.
 * This material may be covered by one or more patents or pending patent applications.
 */

import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface NavigationItem {
  id: string;
  path: string;
  icon: IconDefinition;
  label: string;
  tooltip: string;
  badge?: number; // Optional badge count
  disabled?: boolean; // Optional disabled state
}

export interface NavigationConfig {
  items: NavigationItem[];
}
