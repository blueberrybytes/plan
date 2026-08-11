# Manual live checks

Not part of the automated suite (no `.spec.ts` suffix → vitest's glob skips them)
because they hit a REAL third-party instance and create real records.

## twentyLive.manual.ts

Verifies the Twenty integration against a live instance: auth, company/person
search (including the surname `or()` filter), markdown building, note creation
and `noteTarget` linking.

```bash
cp twentyLive.manual.ts twentyLive.spec.ts   # make vitest pick it up
TW_URL=https://crm.example.com \
TW_KEY=<api key> \
TEST_COMPANY_ID=<a throwaway company id> \
  npx vitest run src/services/__tests__/manual/twentyLive.spec.ts
rm twentyLive.spec.ts
```

Create a throwaway company first and delete it (plus any notes it collected)
afterwards — these tests write to the CRM.
