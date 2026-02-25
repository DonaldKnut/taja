# OAuth Callback Fix - Summary

## 🐛 Issues Fixed

### Issue 1: Callback Page Stuck/Loading Forever
**Problem**: After OAuth authentication, users were redirected to `/auth/callback` but the page never loaded or redirected.

**Root Cause**: 
- The callback handler was trying to fetch user data before tokens were properly stored
- Error handling wasn't catching API failures properly
- No proper redirect logic for new vs existing users

**Solution**:
- ✅ Store tokens in localStorage FIRST before making API calls
- ✅ Added comprehensive error handling with proper error messages
- ✅ Added console logging for debugging
- ✅ Added validation to ensure user data is valid before proceeding

### Issue 2: New OAuth Users Not Redirected to Role Selection
**Problem**: New users signing up with Google OAuth were not being redirected to the role selection page to choose buyer/seller and complete their profile.

**Root Cause**:
- No logic to detect new OAuth users
- No redirect to role selection page
- New OAuth users were being sent directly to dashboard

**Solution**:
- ✅ Added detection logic for new OAuth users (missing phone number)
- ✅ Redirect new OAuth users to `/auth/select-role` page
- ✅ Existing users with complete profiles go directly to dashboard

---

## 🔄 Updated OAuth Flow

### For New OAuth Users (First Time Signing Up)

```
1. User clicks "Sign in with Google"
   ↓
2. Completes Google authentication
   ↓
3. Backend redirects to: /auth/callback?token=...&success=true
   ↓
4. Frontend callback handler:
   - Stores tokens in localStorage
   - Fetches user data from API
   - Detects: No phone number = New OAuth user
   ↓
5. Redirects to: /auth/select-role?redirect=/dashboard
   ↓
6. User selects role (Buyer or Seller)
   ↓
7. Redirects to:
   - /dashboard (if buyer)
   - /seller/setup (if seller)
   ↓
8. User can add phone number later in Settings
```

### For Existing OAuth Users (Returning Users)

```
1. User clicks "Sign in with Google"
   ↓
2. Completes Google authentication
   ↓
3. Backend redirects to: /auth/callback?token=...&success=true
   ↓
4. Frontend callback handler:
   - Stores tokens in localStorage
   - Fetches user data from API
   - Detects: Has phone number = Existing user
   ↓
5. Redirects directly to: /dashboard (or original redirect path)
```

---

## 📝 Code Changes

### File: `src/app/auth/callback/page.tsx`

**Key Changes**:

1. **Token Storage First**
   ```typescript
   // Store tokens BEFORE making API calls
   localStorage.setItem("token", token);
   localStorage.setItem("refreshToken", refreshToken);
   ```

2. **Better Error Handling**
   ```typescript
   try {
     response = await api("/api/users/me");
   } catch (err) {
     // Try fallback endpoint
     response = await api("/api/auth/profile");
   }
   ```

3. **New User Detection**
   ```typescript
   const hasPhone = userData?.phone && userData.phone.trim() !== "";
   const isNewOAuthUser = !hasPhone;
   
   if (isNewOAuthUser) {
     router.push(`/auth/select-role?redirect=${encodeURIComponent(redirect)}`);
     return;
   }
   ```

4. **Console Logging for Debugging**
   - Added logs to track API calls
   - Added logs to track user data
   - Added error logging with details

---

## ✅ Testing Checklist

### Test New OAuth User Flow

1. [ ] Sign up with Google OAuth (new account)
2. [ ] Verify redirect to `/auth/callback`
3. [ ] Verify callback page loads (shows loading spinner)
4. [ ] Verify redirect to `/auth/select-role`
5. [ ] Select "Buyer" role
6. [ ] Verify redirect to `/dashboard`
7. [ ] Go to Settings and add phone number
8. [ ] Verify phone number is saved

### Test Existing OAuth User Flow

1. [ ] Sign in with Google OAuth (existing account with phone)
2. [ ] Verify redirect to `/auth/callback`
3. [ ] Verify callback page loads
4. [ ] Verify direct redirect to `/dashboard` (skips role selection)
5. [ ] Verify user is logged in

### Test Error Handling

1. [ ] Test with invalid token (should redirect to login)
2. [ ] Test with API failure (should show error and redirect)
3. [ ] Test with missing user data (should handle gracefully)

---

## 🔍 Debugging

If the callback page is still stuck, check the browser console for:

1. **API Call Logs**
   ```
   🌐 API Call: { method: "GET", url: "...", hasToken: true }
   ```

2. **User Data Logs**
   ```
   User data stored successfully: { id: "...", email: "...", role: "...", hasPhone: false }
   ```

3. **Error Logs**
   ```
   Failed to fetch user data: Error: ...
   Error details: { message: "...", status: 401, data: {...} }
   ```

### Common Issues

**Issue**: "Failed to fetch user data"
- **Cause**: API endpoint doesn't exist or token is invalid
- **Solution**: Check backend API endpoints and token validation

**Issue**: "Invalid user data received"
- **Cause**: API returns unexpected format
- **Solution**: Check API response format matches expected structure

**Issue**: Still redirecting to dashboard for new users
- **Cause**: User already has phone number in database
- **Solution**: Check user data in database, phone might have been added

---

## 📋 Backend Requirements

The backend should:

1. ✅ Return user data in this format:
   ```json
   {
     "data": {
       "_id": "user_id",
       "email": "user@example.com",
       "fullName": "User Name",
       "phone": "",  // Empty for new OAuth users
       "role": "buyer",  // Default role
       "createdAt": "2024-01-01T00:00:00Z"
     }
   }
   ```

2. ✅ Support these endpoints:
   - `GET /api/users/me` (preferred)
   - `GET /api/auth/profile` (fallback)

3. ✅ Accept Bearer token in Authorization header:
   ```
   Authorization: Bearer <token>
   ```

---

## 🎯 Next Steps

1. **Test the flow** with a new Google account
2. **Verify role selection** works correctly
3. **Test phone number addition** in settings
4. **Monitor console logs** for any errors
5. **Update backend** if API endpoints don't match

---

## 📝 Notes

- Phone number is used as the indicator for new OAuth users because it's required in regular signup but missing in OAuth signup
- Users can add phone number later in Settings → Profile
- Role selection is only shown for new OAuth users (those without phone numbers)
- Existing users with complete profiles skip role selection and go directly to dashboard

