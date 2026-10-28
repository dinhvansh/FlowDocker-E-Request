# Independent React host

Copy `flowdocker-forms-0.2.0.tgz` beside package.json, then `npm install` and `npm run dev`.
This app imports only the packed product, React and React DOM. `npm run build` checks all exported declarations with skipLibCheck=false and bundles the independent consumer.

Synthetic data only. Submissions are displayed locally. Uploads are intentionally unavailable without a host upload adapter. Switch VI/EN using the flag selector and light/dark using the sun/moon control.
