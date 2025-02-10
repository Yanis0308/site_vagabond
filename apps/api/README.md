# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)

This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `pnpm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `pnpm run start`

For production mode

### `pnpm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).

# Tokens

## Expired token

```
eyJhbGciOiJSUzI1NiIsImtpZCI6IjkyODg2OGRjNDRlYTZhOThjODhiMzkzZDM2NDQ1MTM2NWViYjMwZDgiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQmVub8OudCBSZW15IiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0otMVRzUUhVd2pXVTlGRE4yUU5HbEtPYkVkM2xaMWhoRlk3WTVNRlJXbUlkVHB5MTlldnc9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdmFnYWJvbmQtZGV2LWExMjQxIiwiYXVkIjoidmFnYWJvbmQtZGV2LWExMjQxIiwiYXV0aF90aW1lIjoxNzMyMjExMTE0LCJ1c2VyX2lkIjoibENTTVBUWmZRVVhPWnl6NDBTT013RUdLM2laMiIsInN1YiI6ImxDU01QVFpmUVVYT1p5ejQwU09Nd0VHSzNpWjIiLCJpYXQiOjE3MzIyMTExMTQsImV4cCI6MTczMjIxNDcxNCwiZW1haWwiOiJiZW5vaXQucmVteWxhbmdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTE5NTU1MTQ0Njk0Mzg0MDgyODQiXSwiZW1haWwiOlsiYmVub2l0LnJlbXlsYW5nQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.fwrnfjcuGzCsaGhWUv4iHj-siIPDZcYMoOmdMUOuYdTjhifanoE7uv6pRl-HVl04GMdeDN34WOtwnCUNPTqKeU01eK8Lbh1MHXoA0FkqLpUezYDv4PelY8Av3HYh9n-l4gOSpv1NFdI6J6IfR6C2FcQNXpSfnxC1jW8g5LS1RB95lJgTX2uznXY6rZ4R3bobsXYO4rZAbpHEe6_v6oIYI7WmUY-dzgmW5HigLqV3RakyUpn6NtyMSHnXlpzhmDTjlqJWmDYgeeYbdKx96OOGiuAUFp6KNWri3qMAtuZgukKLjKweDpfZ3BW7bR9WNYNvTESHZpf5G3RzqF9By-xsKQ
```

# Seed data

```sql
INSERT INTO pois (name, description, source, source_id, coords, created_at, last_updated)
VALUES
  (
    'Grand Place',
    'Place centrale historique de Lille avec son emblématique Vieille Bourse',
    'manual',
    'lille_grand_place',
    ST_SetSRID(ST_MakePoint(3.063664, 50.636750), 4326),
    NOW(),
    NOW()
  ),
  (
    'Palais des Beaux-Arts',
    'Un des plus grands musées de France, collections exceptionnelles de peintures européennes',
    'manual',
    'lille_pba',
    ST_SetSRID(ST_MakePoint(3.067419, 50.632470), 4326),
    NOW(),
    NOW()
  ),
  (
    'Citadelle de Lille',
    'Fort militaire du XVIIe siècle en forme d''étoile, conçu par Vauban',
    'manual',
    'lille_citadelle',
    ST_SetSRID(ST_MakePoint(3.044944, 50.639722), 4326),
    NOW(),
    NOW()
  ),
  (
    'Vieux-Lille',
    'Quartier historique avec ses rues pavées et son architecture flamande',
    'manual',
    'lille_vieux_lille',
    ST_SetSRID(ST_MakePoint(3.065833, 50.640278), 4326),
    NOW(),
    NOW()
  ),
  (
    'Gare Lille Flandres',
    'Principale gare ferroviaire de Lille, située en plein centre-ville',
    'manual',
    'lille_gare_flandres',
    ST_SetSRID(ST_MakePoint(3.069678, 50.636111), 4326),
    NOW(),
    NOW()
  );
```
