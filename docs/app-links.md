# Android App Links

The email verification link opens the app via Android App Links, verified through
`assetlinks.json` hosted on Vercel (not in this repo — deployed manually via
[vercel.com/drop](https://vercel.com/drop)).

App Links verifies, via a signed assetlinks.json hosted on your domain, that your specific app owns a given URL, so Android opens the link directly in the app instead of a browser

If the signing keystore ever changes (new SHA256, switch to the shared
`google-debug.keystore`, or a release keystore), you must:

1. Get the new SHA256: `keytool -list -v -keystore <keystore> -alias <alias> -storepass <password>`
2. Update `sha256_cert_fingerprints` in `assetlinks.json`
3. Re-upload the file to vercel (https://vercel.com)

Until this is done, App Links verification will fail and the email link will fall back to opening a browser instead of the app.
