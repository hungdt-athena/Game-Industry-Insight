#!/bin/bash

# Script to switch to optimized queries

echo "🔄 Switching to optimized queries..."

# Step 1: Backup current queries
cp frontend/src/lib/queries.ts frontend/src/lib/queries.backup.ts
echo "✅ Backup created: queries.backup.ts"

# Step 2: Copy optimized version
cp frontend/src/lib/queries-optimized.ts frontend/src/lib/queries-temp.ts

# Step 3: Append the rest of the functions from original queries
# (We only optimize getFeedPosts, keep other functions like getRandomPosts, etc.)

echo "✅ To complete:"
echo "1. Manually merge queries-optimized.ts into queries.ts"
echo "2. OR use queries-optimized.ts directly by changing imports"
echo ""
echo "💡 Recommended: Test in dev first!"
echo "   npm run dev"
echo ""
echo "📝 To rollback:"
echo "   cp frontend/src/lib/queries.backup.ts frontend/src/lib/queries.ts"
