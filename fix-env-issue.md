# Fix Environment Variable Issue

The OpenAI API key isn't being loaded properly. Here's how to fix it:

## Quick Fix Steps

### 1. Stop Your Development Server
If it's running, press `Ctrl+C` to stop it.

### 2. Verify Your .env.local File
Make sure your `.env.local` file contains:

```env
OPENAI_API_KEY="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"
```

### 3. Clear Next.js Cache
```bash
# Delete the .next folder to clear cache
rm -rf .next

# On Windows, use:
rmdir /s .next
```

### 4. Restart Development Server
```bash
npm run dev
```

### 5. Test Environment Loading
Go to: http://localhost:3000/api/debug/env

You should see:
```json
{
  "message": "Environment variables status",
  "environment": {
    "OPENAI_API_KEY": "Set (length: 164)"
  }
}
```

## Alternative: Manual Test

If the above doesn't work, try this manual test:

### Create a test file: `test-env.js`
```javascript
// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
console.log('Length:', process.env.OPENAI_API_KEY?.length || 0);
```

### Run it:
```bash
node test-env.js
```

## Common Issues & Solutions

### Issue 1: .env.local in wrong location
- Make sure `.env.local` is in your project root (same level as `package.json`)

### Issue 2: Cached environment
- Delete `.next` folder and restart

### Issue 3: Syntax error in .env.local
- Make sure there are no spaces around the `=`
- Make sure the key is wrapped in quotes

### Issue 4: IDE/Editor caching
- Close and reopen your IDE
- Or restart your terminal

## Correct .env.local Format

```env
# No spaces around =, key in quotes
OPENAI_API_KEY="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"

# Other variables...
```

## After Fixing

1. Restart your dev server: `npm run dev`
2. Test at: http://localhost:3000/dashboard/test-integration
3. The OpenAI test should now pass ✅

Let me know if you're still having issues after trying these steps!