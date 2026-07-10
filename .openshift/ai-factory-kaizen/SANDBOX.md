# Sandbox deploy — ai-factory-kaizen

Deploy runbook for coding agents. `nx run ai-factory-kaizen:sandbox` builds the
image **locally with podman**, pushes it to GHCR, imports it into the
`ui-components-build` namespace, and rolls out — no git push or CI wait. The
orchestration lives in the `@abgov/nx-oc:sandbox` executor (versioned in the
plugin), so the steps below are what it runs for you.

## What the target does, in order

1. **Preflight** — `oc` login, `gh` auth, and `podman` machine are checked up
   front; a failure here stops before the build with an actionable message.
2. Upsert the pull secret + the `CLIENT_SECRET` secret + any paired Services.
3. `nx build ai-factory-kaizen --configuration production`
4. `podman build` → `podman login` (gh token) → `podman push` to
   `ghcr.io/govalta/ui-components-build-ai-factory-kaizen:sandbox`.
5. `oc tag … --reference-policy=local` then `oc import-image` (retried to absorb
   the tag-reconcile 409).
6. `oc process | oc apply` the manifest, then `oc rollout restart` + `status`.

## Options (resume a partial deploy without rebuilding)

```bash
nx run ai-factory-kaizen:sandbox --skipBuild            # reuse the built image; re-push + import + roll out
nx run ai-factory-kaizen:sandbox --skipBuild --skipPush # reuse the pushed image; re-import + roll out only
nx run ai-factory-kaizen:sandbox --imageTag=<tag>       # push/import under a different tag
nx run ai-factory-kaizen:sandbox --importRetries=8      # more import retries on a slow cluster
```

## Preflight failures — cause → fix

- **`'podman' is required …`** — podman not installed. `brew install podman` (macOS).
- **`podman is installed but not responding`** — machine stopped. `podman machine start`.
- **`'gh' is required …`** — GitHub CLI not installed. See https://cli.github.com.
- **`gh is installed but not authenticated`** — run `gh auth login`.
- **oc login prompts / fails** — `oc login` to your cluster, targeting the
  `ui-components-build` namespace (`oc project ui-components-build`).

## If the deploy fails mid-way (work around by hand)

The executor stops at the first failing step. After fixing the cause, the
fastest path is usually `--skipBuild` (or `--skipBuild --skipPush`) to resume.
If you need to drive it manually, these are the remaining steps — the image ref
is `ghcr.io/govalta/ui-components-build-ai-factory-kaizen:sandbox`:

```bash
NS=ui-components-build
REF=ghcr.io/govalta/ui-components-build-ai-factory-kaizen:sandbox
# (1) push, if not already pushed
gh auth token | podman login ghcr.io -u "$(gh api user -q .login)" --password-stdin
podman push "$REF"
# (2) point the imagestream at it and import (retry absorbs the tag race)
oc tag "$REF" ai-factory-kaizen:sandbox --reference-policy=local -n "$NS"
until oc import-image ai-factory-kaizen:sandbox --confirm -n "$NS"; do sleep 3; done
# (3) apply the manifest and roll out
oc process -f .openshift/ai-factory-kaizen/ai-factory-kaizen.yml -p PROJECT="$NS" | oc apply -f -
oc rollout restart deployment/ai-factory-kaizen -n "$NS"
oc rollout status  deployment/ai-factory-kaizen -n "$NS" --timeout=180s
```

## Verify

```bash
oc get pods -n ui-components-build -l name=ai-factory-kaizen
curl "https://$(oc get route ai-factory-kaizen -n ui-components-build -o jsonpath='{.spec.host}')/health"
```

## Known issues & workarounds

- **`podman push` / import fails with an auth error** — the _active_ `gh`
  account lacks `write:packages` (or access to the org). Preflight only confirms
  _an_ account is logged in, not its scope. Check `gh auth status`; switch with
  `gh auth switch -u <account>`, then re-run with `--skipBuild`.
- **Pod `FailedCreate` "exceeded quota"** — the namespace CPU quota is full.
  Free room: `oc get deploy -n ui-components-build` then delete stale apps
  (`oc delete all,configmap,is -l app=<old-app> -n ui-components-build`), and re-run.
- **Pod `CrashLoopBackOff`** — `oc logs -n ui-components-build <pod> -c ai-factory-kaizen`.
- **Import 409 "object has been modified"** — the `oc tag` reconcile race; the
  executor already retries. If you hit it manually, just re-run the import.

## Teardown

```bash
nx run ai-factory-kaizen:sandbox-teardown   # remove sandbox resources + delete the GHCR image
```
