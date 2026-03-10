import { create } from 'zustand';
import type { AppRoute, ModuleRoute } from '../types';
import { routeToModule } from '../types';

interface NavState {
  currentRoute: AppRoute;
  activeModuleRoute: ModuleRoute | null;
  setRoute: (route: AppRoute) => void;
}

export const useNavStore = create<NavState>((set) => ({
  currentRoute: 'dashboard',
  activeModuleRoute: 'dashboard',
  setRoute: (route) =>
    set({
      currentRoute: route,
      activeModuleRoute: routeToModule[route] ?? null,
    }),
}));
