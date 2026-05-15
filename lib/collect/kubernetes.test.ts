import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { CollectInventoryConfig } from "@/lib/collect/types"
import { testEnv } from "@/lib/collect/test-env"

const baseConfig: CollectInventoryConfig = {
  nexus: { url: testEnv.nexusUrl },
  gitlab: { baseUrl: testEnv.gitlabBaseUrl, projects: [] },
  argocd: { baseUrl: testEnv.argocdBaseUrl },
  kubernetes: {
    clusterName: "sth-prod-cluster",
    namespaces: ["sth-approval-system", "sth-portal-member-backend"],
    appNamespaces: ["sth-approval-system", "sth-portal-member-backend"],
  },
  vms: [],
}

let testConfig: CollectInventoryConfig = structuredClone(baseConfig)

vi.mock("@/lib/collect/config", () => ({
  getInventoryConfig: () => testConfig,
}))

import { collectKubernetes } from "@/lib/collect/kubernetes"

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function createKubernetesResponder({
  deployments = [
    {
      metadata: {
        namespace: "sth-approval-system",
        name: "approval-frontend",
      },
      spec: { replicas: 1 },
      status: {
        replicas: 1,
        readyReplicas: 1,
        updatedReplicas: 1,
        availableReplicas: 1,
        unavailableReplicas: 0,
      },
    },
  ],
  pods = [
    {
      metadata: {
        namespace: "sth-approval-system",
        name: "approval-frontend-a",
      },
      status: {
        conditions: [{ type: "Ready", status: "True" }],
        containerStatuses: [{ restartCount: 0 }],
      },
    },
  ],
  pvcs = [],
}: {
  deployments?: unknown[]
  pods?: unknown[]
  pvcs?: unknown[]
} = {}) {
  return async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname

    if (path === "/api/v1/nodes") {
      return jsonResponse({
        items: [
          {
            metadata: { name: "worker-a" },
            status: {
              allocatable: { cpu: "4", memory: "8Gi" },
              conditions: [{ type: "Ready", status: "True" }],
            },
          },
        ],
      })
    }

    if (path === "/api/v1/namespaces") {
      return jsonResponse({
        items: [
          { metadata: { name: "sth-approval-system" } },
          { metadata: { name: "sth-portal-member-backend" } },
        ],
      })
    }

    if (path === "/apis/apps/v1/deployments") {
      return jsonResponse({ items: deployments })
    }

    if (path === "/api/v1/pods") {
      return jsonResponse({ items: pods })
    }

    if (path === "/api/v1/persistentvolumeclaims") {
      return jsonResponse({ items: pvcs })
    }

    if (path === "/apis/metrics.k8s.io/v1beta1/nodes") {
      return jsonResponse({ items: [] })
    }

    return jsonResponse({ items: [] })
  }
}

describe("collectKubernetes", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    testConfig = structuredClone(baseConfig)
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)
    process.env.KUBERNETES_BEARER_TOKEN = "k8s-token"
    process.env.KUBERNETES_API_URL = "https://k8s.example.local"
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.KUBERNETES_BEARER_TOKEN
    delete process.env.KUBERNETES_API_URL
  })

  it("returns permission_error when kubernetes token is missing", async () => {
    delete process.env.KUBERNETES_BEARER_TOKEN

    const result = await collectKubernetes(new AbortController().signal)

    expect(result.status).toBe("permission_error")
    expect(result.error?.code).toBe("PERMISSION_DENIED")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("collects workload, pod and node resource snapshots", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      const path = new URL(url).pathname

      if (path === "/api/v1/nodes") {
        return jsonResponse({
          items: [
            {
              metadata: { name: "worker-a" },
              status: {
                allocatable: { cpu: "4", memory: "8Gi" },
                conditions: [{ type: "Ready", status: "True" }],
              },
            },
          ],
        })
      }

      if (path === "/api/v1/namespaces") {
        return jsonResponse({
          items: [
            { metadata: { name: "sth-approval-system" } },
            { metadata: { name: "sth-portal-member-backend" } },
            { metadata: { name: "observability" } },
          ],
        })
      }

      if (path === "/apis/apps/v1/deployments") {
        return jsonResponse({
          items: [
            {
              metadata: {
                namespace: "sth-approval-system",
                name: "approval-frontend",
              },
              spec: { replicas: 2 },
              status: {
                replicas: 2,
                readyReplicas: 2,
                updatedReplicas: 2,
                availableReplicas: 2,
                unavailableReplicas: 0,
              },
            },
            {
              metadata: {
                namespace: "sth-portal-member-backend",
                name: "member-backend",
              },
              spec: { replicas: 1 },
              status: {
                replicas: 1,
                readyReplicas: 1,
                updatedReplicas: 1,
                availableReplicas: 1,
                unavailableReplicas: 0,
              },
            },
          ],
        })
      }

      if (path === "/apis/apps/v1/statefulsets") {
        return jsonResponse({ items: [] })
      }

      if (path === "/apis/apps/v1/daemonsets") {
        return jsonResponse({ items: [] })
      }

      if (path === "/apis/apps/v1/replicasets") {
        return jsonResponse({
          items: [
            {
              metadata: {
                namespace: "sth-approval-system",
                name: "approval-frontend-6d5f8",
                ownerReferences: [
                  {
                    kind: "Deployment",
                    name: "approval-frontend",
                    controller: true,
                  },
                ],
              },
            },
            {
              metadata: {
                namespace: "sth-portal-member-backend",
                name: "member-backend-123ab",
                ownerReferences: [
                  {
                    kind: "Deployment",
                    name: "member-backend",
                    controller: true,
                  },
                ],
              },
            },
          ],
        })
      }

      if (path === "/api/v1/pods") {
        return jsonResponse({
          items: [
            {
              metadata: {
                namespace: "sth-approval-system",
                name: "approval-frontend-6d5f8-a",
                ownerReferences: [
                  {
                    kind: "ReplicaSet",
                    name: "approval-frontend-6d5f8",
                    controller: true,
                  },
                ],
              },
              status: {
                conditions: [{ type: "Ready", status: "True" }],
                containerStatuses: [{ restartCount: 1 }],
              },
            },
            {
              metadata: {
                namespace: "sth-portal-member-backend",
                name: "member-backend-123ab-a",
                ownerReferences: [
                  {
                    kind: "ReplicaSet",
                    name: "member-backend-123ab",
                    controller: true,
                  },
                ],
              },
              status: {
                conditions: [{ type: "Ready", status: "True" }],
                containerStatuses: [{ restartCount: 0 }],
              },
            },
          ],
        })
      }

      if (path === "/api/v1/services") {
        return jsonResponse({
          items: [
            {
              metadata: { namespace: "sth-approval-system", name: "frontend" },
            },
            {
              metadata: {
                namespace: "sth-portal-member-backend",
                name: "backend",
              },
            },
          ],
        })
      }

      if (path === "/apis/networking.k8s.io/v1/ingresses") {
        return jsonResponse({
          items: [
            {
              metadata: {
                namespace: "sth-approval-system",
                name: "frontend-ingress",
              },
              spec: { rules: [{ host: testEnv.omniHost }] },
            },
          ],
        })
      }

      if (path === "/api/v1/persistentvolumeclaims") {
        return jsonResponse({
          items: [
            {
              metadata: {
                namespace: "sth-portal-member-backend",
                name: "backend-pvc",
              },
              status: { phase: "Bound" },
            },
            {
              metadata: {
                namespace: "sth-portal-member-backend",
                name: "cache-pvc",
              },
              status: { phase: "Pending" },
            },
          ],
        })
      }

      if (path === "/apis/metrics.k8s.io/v1beta1/nodes") {
        return jsonResponse({
          items: [
            {
              metadata: { name: "worker-a" },
              usage: { cpu: "2000m", memory: "4Gi" },
            },
          ],
        })
      }

      return jsonResponse({ items: [] })
    })

    const result = await collectKubernetes(new AbortController().signal)

    expect(result.status).toBe("stale")
    expect(result.error).toBeNull()
    expect(result.data.clusterName).toBe("sth-prod-cluster")
    expect(result.data.namespaces).toEqual([
      "sth-approval-system",
      "sth-portal-member-backend",
    ])
    expect(result.data.nodes).toEqual([
      {
        name: "worker-a",
        ready: true,
        cpuUsagePercent: 50,
        memoryUsagePercent: 50,
      },
    ])
    expect(result.data.workloads).toHaveLength(2)
    expect(result.data.appWorkloads).toHaveLength(2)
    expect(result.data.pods).toEqual({
      total: 2,
      ready: 2,
      notReady: 0,
      restarting: 1,
    })
    expect(result.data.services.total).toBe(2)
    expect(result.data.ingresses.hosts).toEqual([testEnv.omniHost])
    expect(result.data.pvcs).toEqual({
      total: 2,
      bound: 1,
      pending: 1,
    })

    const frontend = result.data.workloads.find(
      (workload) => workload.name === "approval-frontend"
    )
    expect(frontend?.restartCount).toBe(1)
    expect(frontend).toMatchObject({
      readyReplicas: 2,
      desiredReplicas: 2,
      replicas: 2,
      updatedReplicas: 2,
      availableReplicas: 2,
      unavailableReplicas: 0,
      progressing: false,
    })
  })

  it("returns progressing while a deployment rollout is in progress", async () => {
    fetchMock.mockImplementation(
      createKubernetesResponder({
        deployments: [
          {
            metadata: {
              namespace: "sth-approval-system",
              name: "approval-frontend",
            },
            spec: { replicas: 2 },
            status: {
              replicas: 2,
              readyReplicas: 1,
              updatedReplicas: 1,
              availableReplicas: 1,
              unavailableReplicas: 1,
            },
          },
        ],
        pods: [
          {
            metadata: {
              namespace: "sth-approval-system",
              name: "approval-frontend-old",
            },
            status: {
              conditions: [{ type: "Ready", status: "True" }],
              containerStatuses: [{ restartCount: 0 }],
            },
          },
          {
            metadata: {
              namespace: "sth-approval-system",
              name: "approval-frontend-new",
            },
            status: {
              conditions: [{ type: "Ready", status: "False" }],
              containerStatuses: [{ restartCount: 0 }],
            },
          },
        ],
      })
    )

    const result = await collectKubernetes(new AbortController().signal)

    expect(result.status).toBe("progressing")
    expect(result.data.workloads[0]).toMatchObject({
      readyReplicas: 1,
      desiredReplicas: 2,
      replicas: 2,
      updatedReplicas: 1,
      availableReplicas: 1,
      unavailableReplicas: 1,
      progressing: true,
    })
  })

  it("keeps pending PVCs stale", async () => {
    fetchMock.mockImplementation(
      createKubernetesResponder({
        pvcs: [
          {
            metadata: {
              namespace: "sth-approval-system",
              name: "approval-data",
            },
            status: { phase: "Pending" },
          },
        ],
      })
    )

    const result = await collectKubernetes(new AbortController().signal)

    expect(result.status).toBe("stale")
    expect(result.data.pvcs.pending).toBe(1)
  })

  it("returns ok when all workloads and pods are ready", async () => {
    fetchMock.mockImplementation(createKubernetesResponder())

    const result = await collectKubernetes(new AbortController().signal)

    expect(result.status).toBe("ok")
    expect(result.data.pods.notReady).toBe(0)
    expect(result.data.workloads[0]).toMatchObject({
      readyReplicas: 1,
      desiredReplicas: 1,
      replicas: 1,
      updatedReplicas: 1,
      availableReplicas: 1,
      unavailableReplicas: 0,
      progressing: false,
    })
  })

  it("maps HTTP 403 responses to permission_error", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }))

    const result = await collectKubernetes(new AbortController().signal)

    expect(result.status).toBe("permission_error")
    expect(result.error?.code).toBe("PERMISSION_DENIED")
  })

  it("maps abort errors to timeout status", async () => {
    const abortError = new Error("aborted")
    abortError.name = "AbortError"
    fetchMock.mockRejectedValue(abortError)

    const result = await collectKubernetes(new AbortController().signal)

    expect(result.status).toBe("timeout")
    expect(result.error?.code).toBe("TIMEOUT")
  })
})
