---
title: Frontend Engineer Technical Assessment
subtitle: ClearSpot.ai | Stage 2
date: January 27, 2026
---

# Frontend Engineer - Technical Assessment
## ClearSpot.ai | Stage 2

**Date:** January 27, 2026  
**Time Limit:** 4–6 hours (take-home)  
**Submission:** GitHub repository (preferred) or code-sharing platform  
**Status:** 500+ applications received | Rolling review basis

---

## Overview

This assessment evaluates your ability to integrate a React frontend with backend APIs, handle real-time data, and implement proper error handling. The tasks mirror the actual work required for the AgenticMesh platform integration.

### Quick Facts
- **Format:** Take-home project
- **Expected Time:** 4–6 hours
- **Total Points:** 100
- **Bonus Points:** Up to +15 available
- **Submission:** GitHub repo + README with setup instructions

---

## Assessment Structure

| Part | Topic | Points |
|------|-------|--------|
| **Part 1** | API Integration | 40 |
| **Part 2** | Real-time Data Handling | 30 |
| **Part 3** | Error Handling & UX | 20 |
| **Part 4** | Code Quality | 10 |
| **TOTAL** | | **100** |

---

# Part 1: API Integration (40 points)

## Task 1.1: Create API Client Utility (15 points)

Create a reusable API client utility that:
- Handles authentication with JWT tokens
- Manages base URL configuration
- Provides methods for GET, POST, PUT, DELETE
- Handles request/response interceptors
- Manages token refresh (if needed)

**Expected interface:**
```typescript
interface ApiClient {
  setToken(token: string): void;
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data?: unknown): Promise<T>;
  put<T>(endpoint: string, data?: unknown): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
}
```

**Test Case:**
- Create a mock API server (or use a public API)
- Implement the client
- Make authenticated requests
- Handle 401 errors and token refresh

**Deliverables:**
- `src/lib/api.ts` - API client implementation
- Unit tests for the API client
- Documentation comments

**Scoring:**
- ✅ Full implementation with error handling: **15 points**
- ⚠️ Basic implementation missing error handling: **10 points**
- ❌ Incomplete or non-functional: **0–5 points**

---

## Task 1.2: Replace Mock Data with Real API (25 points)

Given a React component with mocked data, replace it with real API calls using React Query.

**Starting Code (provided):**
```typescript
const SiteList = () => {
  const [sites, setSites] = useState([
    { id: '1', name: 'Site A', capacity: 10 },
    { id: '2', name: 'Site B', capacity: 20 },
  ]);

  return (
    <div>
      {sites.map(site => (
        <div key={site.id}>{site.name}</div>
      ))}
    </div>
  );
};
```

**Requirements:**
1. Replace mock data with API call using React Query
2. Add loading state
3. Add error handling
4. Implement pagination (if API supports it)
5. Add refetch on mount and interval

**API Endpoint (mock or real):**
```
GET /api/sites
Response: {
  sites: Array<{id: string, name: string, capacity: number}>,
  pagination: {page: number, total: number}
}
```

**Deliverables:**
- Updated component using React Query
- Loading and error states
- Proper TypeScript types
- Code comments explaining decisions

**Scoring:**
- ✅ Full implementation with all features: **25 points**
- ⚠️ Implementation missing some features: **15–20 points**
- ❌ Basic implementation: **5–10 points**
- ❌ Non-functional: **0 points**

---

# Part 2: Real-time Data Handling (30 points)

## Task 2.1: WebSocket Integration (20 points)

Create a React hook for WebSocket connections that:
- Connects to a WebSocket endpoint
- Handles connection lifecycle (connect, disconnect, reconnect)
- Receives real-time messages
- Sends messages
- Manages connection state

**Expected hook interface:**
```typescript
const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const sendMessage = (message: any) => void;
  return { isConnected, lastMessage, sendMessage };
};
```

**Test Scenario:**
- Connect to a WebSocket server (mock or real)
- Send a message
- Receive messages
- Handle disconnection and reconnection
- Display connection status in UI

**Deliverables:**
- `src/hooks/useWebSocket.ts` - WebSocket hook
- Example component using the hook
- Error handling for connection failures
- Reconnection logic

**Scoring:**
- ✅ Full implementation with reconnection: **20 points**
- ⚠️ Basic implementation without reconnection: **15 points**
- ❌ Incomplete: **5–10 points**
- ❌ Non-functional: **0 points**

---

## Task 2.2: Real-time Updates in Component (10 points)

Create a component that displays real-time alarm updates using the WebSocket hook.

**Requirements:**
- Display list of alarms
- Update list when new alarm arrives via WebSocket
- Show alarm status (active, acknowledged, resolved)
- Add visual indicators for new alarms
- Handle WebSocket disconnection gracefully

**Mock WebSocket Messages:**
```json
{
  "event": "alarm.created",
  "data": {
    "id": "alarm-123",
    "siteId": "site-1",
    "severity": "high",
    "message": "Inverter fault detected"
  }
}
```

**Deliverables:**
- Component using WebSocket hook
- Real-time updates working
- Visual feedback for new items
- Error handling

**Scoring:**
- ✅ Full implementation: **10 points**
- ⚠️ Basic implementation: **5–7 points**
- ❌ Non-functional: **0 points**

---

# Part 3: Error Handling & UX (20 points)

## Task 3.1: Comprehensive Error Handling (15 points)

Implement error handling for:
1. API errors (400, 401, 403, 404, 500)
2. Network errors (timeout, offline)
3. WebSocket errors (connection failed, message parse error)
4. User-friendly error messages
5. Error recovery (retry, fallback)

**Requirements:**
- Create error boundary component
- Handle different error types appropriately
- Show user-friendly error messages
- Implement retry logic for transient errors
- Log errors for debugging

**Deliverables:**
- Error boundary component
- Error handling utilities
- Example components showing error handling
- Error recovery mechanisms

**Scoring:**
- ✅ Comprehensive error handling: **15 points**
- ⚠️ Basic error handling: **10 points**
- ❌ Minimal error handling: **5 points**
- ❌ No error handling: **0 points**

---

## Task 3.2: Loading States & Optimistic Updates (5 points)

Implement loading states and optimistic updates for a form submission.

**Requirements:**
- Show loading spinner during API call
- Implement optimistic update (update UI before API response)
- Handle success and error states
- Revert optimistic update on error

**Deliverables:**
- Form component with optimistic updates
- Loading states
- Error handling with rollback

**Scoring:**
- ✅ Full implementation: **5 points**
- ⚠️ Partial implementation: **2–3 points**
- ❌ No implementation: **0 points**

---

# Part 4: Code Quality (10 points)

## Evaluation Criteria

**Code Organization (3 points):**
- ✅ Clean file structure
- ✅ Proper separation of concerns
- ✅ Reusable components and utilities

**TypeScript Usage (3 points):**
- ✅ Proper type definitions
- ✅ Type safety throughout
- ✅ No `any` types (unless necessary)

**Documentation (2 points):**
- ✅ Code comments where needed
- ✅ README with setup instructions

**Testing (2 points):**
- ✅ Unit tests for utilities
- ✅ Component tests (if time permits)

**Scoring:**
- ✅ Excellent code quality: **10 points**
- ⚠️ Good code quality: **6–8 points**
- ❌ Basic code quality: **3–5 points**
- ❌ Poor code quality: **0–2 points**

---

# Submission Guidelines

## Required Files

**1. Source Code**
- All implementation files
- Proper project structure
- README.md with setup instructions

**2. Documentation**
- README.md explaining:
  - How to run the project
  - What was implemented
  - Any assumptions made
  - Known limitations

**3. Tests (if applicable)**
- Unit tests
- Integration tests (if time permits)

## Submission Format

**GitHub Repository (preferred)**
- Public or private (share access)
- Clear commit history
- README with instructions

**Alternative**
- Zip file with all code
- Code sharing platform link (Replit, CodeSandbox, etc.)

---

# Bonus Points (Optional)

## Bonus 1: Performance Optimization (+5 points)
- Implement memoization where appropriate
- Optimize re-renders
- Add performance monitoring

## Bonus 2: Advanced Features (+5 points)
- Implement infinite scroll for lists
- Add search/filter functionality
- Implement data caching strategies

## Bonus 3: Testing (+5 points)
- Comprehensive test coverage (>80%)
- Integration tests
- E2E tests (if applicable)

**Maximum Bonus:** +15 points

---

# Time Management Tips

1. **Start with Part 1** - API integration is core functionality
2. **Prioritize functionality** - Working code > perfect code
3. **Document as you go** - Saves time later
4. **Test incrementally** - Don't wait until the end
5. **Focus on requirements** - Don't over-engineer

---

# Evaluation Criteria Summary

| Task | Points | Key Requirements |
|------|--------|------------------|
| API Client | 15 | Authentication, error handling, interceptors |
| API Integration | 25 | React Query, loading, error states, pagination |
| WebSocket Hook | 20 | Connection management, reconnection, messaging |
| Real-time Component | 10 | Live updates, visual feedback |
| Error Handling | 15 | Comprehensive error handling, recovery |
| UX Improvements | 5 | Loading states, optimistic updates |
| Code Quality | 10 | Organization, TypeScript, documentation, tests |
| **TOTAL** | **100** | |

---

# What We're Looking For

## Technical Skills
- ✅ Ability to integrate APIs with React
- ✅ Understanding of React Query patterns
- ✅ WebSocket implementation skills
- ✅ Error handling best practices
- ✅ TypeScript proficiency

## Problem-Solving
- ✅ Ability to break down complex tasks
- ✅ Clean code organization
- ✅ Thoughtful error handling
- ✅ User experience considerations

## Communication
- ✅ Clear code comments
- ✅ Documentation quality
- ✅ Code readability

---

# Submission Checklist

Before submitting, verify:

- [ ] All 4 parts implemented (or majority of core tasks)
- [ ] README.md with clear setup instructions
- [ ] GitHub repo with clean commit history
- [ ] Unit tests for API client
- [ ] Error handling throughout
- [ ] TypeScript types properly defined
- [ ] No console errors in browser
- [ ] Assessment completed within 4–6 hours
- [ ] Code is readable and well-organized

---

# Next Steps

1. **Confirm receipt** of this assessment
2. **Create a GitHub repository** for your submission
3. **Set up the project** (React + TypeScript + React Query)
4. **Implement each task** in order (Part 1 → Part 4)
5. **Test incrementally** as you build
6. **Document your approach** in the README
7. **Submit your GitHub link** with full repo access

---

# FAQs

## Q: What if I can't complete all 4 parts?
**A:** Submit what you have. We evaluate based on quality over completeness. A well-executed Part 1-2 scores better than incomplete Part 1-4.

## Q: Can I use libraries like axios instead of fetch?
**A:** Yes! Use whatever tools you're comfortable with. We care about the architecture and patterns, not the specific library.

## Q: How do you grade the assessment?
**A:** Objectively by the rubric (100 points total). We look for working code, error handling, TypeScript types, and clear documentation. The README explaining your approach carries weight.

## Q: What if I have questions during the assessment?
**A:** Reply in this LinkedIn conversation. We typically respond within 2-4 hours during business hours.

## Q: Is this the final technical evaluation?
**A:** No. If selected after this assessment, Stage 3 is a technical interview (30 min) + system design discussion (30 min) with our engineering lead.

---

**Good luck! We're excited to see your solution.**

*Last Updated: January 27, 2026*

---

**ClearSpot.ai — Frontend Engineering Team**  
7345 W Sand Lake Road, Orlando, FL 32819  
https://clearspot.ai  
hiring@clearspot.ai