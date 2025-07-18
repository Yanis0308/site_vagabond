# vagagond-poc

In `package.json` remove overrides after this issue is fixed: https://github.com/nativewind/nativewind/issues/1503 and update NativeWind version

```json
  "pnpm": {
    "overrides": {
      "lightningcss": "^1.27.0"
    }
  },
```

We have a custom patch to solve this typing issue https://github.com/gluestack/gluestack-ui/issues/2898  

Keep a eye on this issue for box-shadow support in nativewind https://github.com/nativewind/nativewind/issues/1442  
We've tried the purposed patch but color not works, even with our custom code try to differenciate number value to px and colors
We will use RN Stylesheet to make nice shadow meanwhile
