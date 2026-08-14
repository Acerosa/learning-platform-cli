import type { ResolvedHubConfig } from "../config/types.js";

export type HubRoute = {
  id: string;
  label: string;
  path: string;
  file: string;
  section: string;
  page: string;
  depth: number;
  extraAttrs?: Record<string, string>;
};

export function contentPackageDir(config: ResolvedHubConfig): string {
  return `content/${config.hubId}`;
}

export function hubRoutes(config: ResolvedHubConfig): HubRoute[] {
  const routes: HubRoute[] = [
    { id: "home", label: "Home", path: "", file: "index.html", section: "home", page: "home", depth: 0 },
    { id: "resources", label: "Resources", path: "resources/", file: "resources/index.html", section: "resources", page: "resources", depth: 1 },
    { id: "help", label: "Help", path: "help/", file: "help/index.html", section: "help", page: "help", depth: 1 },
    { id: "account", label: "Account", path: "account/", file: "account/index.html", section: "account", page: "account", depth: 1 }
  ];

  if (config.profile === "week-based") {
    routes.splice(1, 0,
      { id: "learning", label: "Weeks", path: "weeks/", file: "weeks/index.html", section: "learning", page: "learning", depth: 1 },
      {
        id: "week-1",
        label: "Week 1",
        path: "weeks/week-1/",
        file: "weeks/week-1/index.html",
        section: "learning",
        page: "week-1",
        depth: 2,
        extraAttrs: { "data-lp-week": "week-1", "data-lp-view": "week" }
      }
    );
  }

  if (config.profile === "task-based") {
    routes.splice(1, 0,
      { id: "foundations", label: "Foundations", path: "foundations/", file: "foundations/index.html", section: "foundations", page: "foundations", depth: 1 },
      { id: "task-1", label: "Task 1", path: "task-1/", file: "task-1/index.html", section: "task-1", page: "task-1", depth: 1 }
    );
  }

  if (config.profile !== "minimal" && config.contextType === "assignment") {
    insertBeforeResources(routes, {
      id: "assignments",
      label: "Assignments",
      path: "assignments/",
      file: "assignments/index.html",
      section: "assignments",
      page: "assignments",
      depth: 1
    });
  }

  if (config.profile !== "minimal" && config.contextType === "project") {
    insertBeforeResources(routes, {
      id: "project",
      label: "Project",
      path: "project/",
      file: "project/index.html",
      section: "project",
      page: "project",
      depth: 1
    });
  }

  return routes;
}

export function navigationRoutes(config: ResolvedHubConfig): HubRoute[] {
  return hubRoutes(config).filter((route) => route.file.split("/").length <= 2 || route.id === "home");
}

function insertBeforeResources(routes: HubRoute[], route: HubRoute): void {
  const index = routes.findIndex((item) => item.id === "resources");
  routes.splice(index, 0, route);
}

export function dataRoot(depth: number): string {
  if (depth <= 0) return ".";
  return Array.from({ length: depth }, () => "..").join("/");
}

export function scriptSrc(depth: number): string {
  return `${dataRoot(depth)}/src/main.tsx`;
}
