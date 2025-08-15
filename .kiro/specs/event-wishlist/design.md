# Event Wishlist Feature Design

## Overview

The Event Wishlist feature allows users to save events they're interested in by clicking a heart icon. This creates a personalized collection of events that users can access through a dedicated wishlist page. The feature integrates seamlessly with the existing authentication system and provides real-time visual feedback.

## Architecture

### Database Design

**New Table: `user_wishlists`**
```sql
CREATE TABLE user_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_user_wishlists_user_id ON user_wishlists(user_id);
CREATE INDEX idx_user_wishlists_event_id ON user_wishlists(event_id);
```

### API Endpoints

**Wishlist Management:**
- `POST /v1/wishlist` - Add event to wishlist
- `DELETE /v1/wishlist/:eventId` - Remove event from wishlist
- `GET /v1/wishlist` - Get user's wishlist events
- `GET /v1/wishlist/check` - Check wishlist status for multiple events

## Components and Interfaces

### Frontend Components

**1. WishlistButton Component**
```jsx
<WishlistButton 
  eventId={string}
  isWishlisted={boolean}
  onToggle={function}
  size="sm|md|lg"
  className={string}
/>
```

**2. WishlistPage Component**
- Displays user's wishlisted events in grid layout
- Handles empty state
- Integrates with existing event card components

**3. useWishlist Hook**
```jsx
const {
  wishlist,
  isWishlisted,
  addToWishlist,
  removeFromWishlist,
  loading,
  error
} = useWishlist();
```

### Backend Services

**WishlistService**
- `addToWishlist(userId, eventId)`
- `removeFromWishlist(userId, eventId)`
- `getUserWishlist(userId, pagination)`
- `checkWishlistStatus(userId, eventIds[])`
- `getWishlistCount(userId)`

## Data Models

### Wishlist Item Model
```javascript
{
  id: "uuid",
  userId: "uuid",
  eventId: "uuid",
  createdAt: "timestamp",
  event: {
    // Full event object with organizer details
    id: "uuid",
    title: "string",
    description: "string",
    coverImageUrl: "string",
    startDate: "timestamp",
    venue: "string",
    price: "number",
    isFree: "boolean",
    organizer: {
      firstName: "string",
      lastName: "string"
    }
  }
}
```

### API Response Models

**Add/Remove Response:**
```javascript
{
  success: true,
  message: "Event added to wishlist",
  data: {
    isWishlisted: true,
    wishlistCount: 5
  }
}
```

**Get Wishlist Response:**
```javascript
{
  success: true,
  data: {
    wishlist: [WishlistItem],
    pagination: {
      page: 1,
      limit: 12,
      total: 25,
      pages: 3
    }
  }
}
```

## Error Handling

### Frontend Error States
- **Network Errors**: Show retry button with error message
- **Authentication Errors**: Redirect to login page
- **Server Errors**: Display user-friendly error message
- **Optimistic Updates**: Revert UI state if API call fails

### Backend Error Responses
- **401 Unauthorized**: User not authenticated
- **404 Not Found**: Event doesn't exist
- **409 Conflict**: Event already in wishlist (for add operation)
- **500 Internal Error**: Database or server errors

### Error Recovery
- Implement retry logic for failed API calls
- Use optimistic updates with rollback on failure
- Cache wishlist state locally for offline resilience

## Testing Strategy

### Unit Tests
- WishlistButton component interactions
- useWishlist hook state management
- WishlistService methods
- API endpoint validation

### Integration Tests
- Complete add/remove wishlist flow
- Wishlist page loading and display
- Authentication integration
- Database constraint validation

### E2E Tests
- User can add event to wishlist from events page
- User can view wishlist page with saved events
- User can remove events from wishlist
- Wishlist persists across login sessions

## Performance Considerations

### Frontend Optimizations
- **Batch API Calls**: Check multiple events' wishlist status in single request
- **Optimistic Updates**: Immediate UI feedback before API response
- **Local Caching**: Cache wishlist status to reduce API calls
- **Lazy Loading**: Load wishlist page content progressively

### Backend Optimizations
- **Database Indexing**: Efficient queries on user_id and event_id
- **Bulk Operations**: Support checking multiple events at once
- **Caching**: Cache user wishlist counts and frequently accessed data
- **Pagination**: Limit wishlist results to prevent large payloads

### Caching Strategy
- Cache wishlist status for events on frontend (5 minutes TTL)
- Cache user wishlist count in backend (Redis, 10 minutes TTL)
- Invalidate cache on wishlist modifications

## Security Considerations

### Authorization
- Users can only access their own wishlist
- Validate user ownership before any wishlist operations
- Prevent unauthorized access to other users' wishlists

### Data Validation
- Validate event exists before adding to wishlist
- Sanitize all input parameters
- Implement rate limiting on wishlist operations

### Privacy
- Wishlists are private to each user
- No public wishlist sharing functionality
- Secure API endpoints with proper authentication

## User Experience Design

### Visual Design
- **Heart Icon**: Outline when not wishlisted, filled when wishlisted
- **Colors**: Primary color for active state, gray for inactive
- **Animations**: Smooth transitions (200ms) for state changes
- **Hover States**: Subtle scale/color changes on hover

### Interaction Patterns
- **Single Click**: Toggle wishlist status
- **Visual Feedback**: Immediate state change with loading indicator
- **Error States**: Clear error messages with retry options
- **Empty States**: Encouraging message with call-to-action

### Accessibility
- **ARIA Labels**: Proper labels for screen readers
- **Keyboard Navigation**: Tab-accessible wishlist buttons
- **Color Contrast**: Sufficient contrast for all states
- **Focus Indicators**: Clear focus states for keyboard users

## Mobile Considerations

### Touch Interactions
- **Touch Targets**: Minimum 44px touch targets for heart buttons
- **Gesture Support**: No conflicting gestures with existing interactions
- **Responsive Design**: Proper spacing and sizing on all screen sizes

### Performance
- **Reduced API Calls**: Batch operations for mobile efficiency
- **Offline Support**: Basic offline wishlist viewing capability
- **Fast Interactions**: Optimistic updates for immediate feedback

## Integration Points

### Existing Systems
- **Authentication**: Integrate with existing JWT auth system
- **Events API**: Extend existing events endpoints with wishlist status
- **User Profile**: Add wishlist link to user dropdown menu
- **Navigation**: Add "My Favorites" to user navigation

### Future Enhancements
- **Email Notifications**: Notify users of wishlisted event updates
- **Recommendations**: Suggest similar events based on wishlist
- **Social Features**: Share wishlist with friends (future consideration)
- **Analytics**: Track wishlist usage for insights