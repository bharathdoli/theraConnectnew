import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Role } from '@prisma/client';
import {
  getAvailableSlotsHandler,
  createBookingHandler,
  getMyBookingsHandler,
  markSessionCompletedHandler,
} from './booking.controller';
import { getSlotsQuerySchema, createBookingSchema } from './booking.validation';
import * as zoomController from './zoom.controller';

const router = Router();
router.use(authenticate);

// A parent can get slots for a therapist
router.get(
  '/slots',
  authorize([Role.PARENT]),
  validate({ query: getSlotsQuerySchema.shape.query }),
  getAvailableSlotsHandler
);

// A parent can create a booking
router.post('/', authorize([Role.PARENT]), validate({ body: createBookingSchema.shape.body }), createBookingHandler);

// Both parents and therapists can view their own bookings
router.get('/me', authorize([Role.PARENT, Role.THERAPIST]), getMyBookingsHandler);

// Zoom meeting integration
// Therapist creates a Zoom meeting for a booking (stores meetingId/password)
router.post(
  '/:bookingId/zoom/create',
  authorize([Role.THERAPIST]),
  zoomController.createMeetingForBooking
);

// Therapist toggles that host has started the session
router.post(
  '/:bookingId/zoom/host-started',
  authorize([Role.THERAPIST]),
  zoomController.markHostStarted
);

// Get SDK signature for current user (role derived), blocked if parent and host not started
router.get(
  '/:bookingId/zoom/signature',
  authorize([Role.PARENT, Role.THERAPIST]),
  zoomController.getSignature
);

// Mark session as completed (can be called by both parent and therapist)
router.post(
  '/:bookingId/complete',
  authorize([Role.PARENT, Role.THERAPIST]),
  markSessionCompletedHandler
);

export default router;