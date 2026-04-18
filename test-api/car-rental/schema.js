import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLSchema
} from 'graphql'

import db from './db/connection'
import { authenticateClient, requireAuth } from './auth'
import { pubsub, EVENTS } from './pubsub'

// ============ ENUMS ============

const FuelTypeEnum = new GraphQLEnumType({
  name: 'FuelType',
  values: {
    PETROL: { value: 'petrol' },
    DIESEL: { value: 'diesel' },
    ELECTRIC: { value: 'electric' },
    HYBRID: { value: 'hybrid' }
  }
})

const TransmissionEnum = new GraphQLEnumType({
  name: 'Transmission',
  values: {
    MANUAL: { value: 'manual' },
    AUTOMATIC: { value: 'automatic' }
  }
})

const ReservationStatusEnum = new GraphQLEnumType({
  name: 'ReservationStatus',
  values: {
    PENDING: { value: 'pending' },
    CONFIRMED: { value: 'confirmed' },
    ACTIVE: { value: 'active' },
    COMPLETED: { value: 'completed' },
    CANCELLED: { value: 'cancelled' }
  }
})

const SortOrderEnum = new GraphQLEnumType({
  name: 'SortOrder',
  values: {
    ASC: { value: 'asc' },
    DESC: { value: 'desc' }
  }
})

// ============ TYPES ============

const CategoryType = new GraphQLObjectType({
  name: 'Category',
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    icon: { type: GraphQLString },
    cars: {
      type: new GraphQLList(CarType),
      resolve: (cat) => db('cars').where('category_id', cat.id)
    },
    carCount: {
      type: GraphQLInt,
      resolve: (cat) => db('cars').where('category_id', cat.id).count('* as cnt').first().then(r => r.cnt)
    }
  })
})

const AgencyType = new GraphQLObjectType({
  name: 'Agency',
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    city: { type: GraphQLString },
    address: { type: GraphQLString },
    phone: { type: GraphQLString },
    email: { type: GraphQLString },
    latitude: { type: GraphQLFloat },
    longitude: { type: GraphQLFloat },
    cars: {
      type: new GraphQLList(CarType),
      resolve: (agency) => db('cars').where('agency_id', agency.id)
    },
    carCount: {
      type: GraphQLInt,
      resolve: (agency) => db('cars').where('agency_id', agency.id).count('* as cnt').first().then(r => r.cnt)
    }
  })
})

const ReviewType = new GraphQLObjectType({
  name: 'Review',
  fields: () => ({
    id: { type: GraphQLInt },
    rating: { type: GraphQLInt },
    comment: { type: GraphQLString },
    created_at: { type: GraphQLString },
    customer: {
      type: CustomerType,
      resolve: (review) => db('customers').where('id', review.customer_id).first()
    },
    car: {
      type: CarType,
      resolve: (review) => db('cars').where('id', review.car_id).first()
    }
  })
})

const CarType = new GraphQLObjectType({
  name: 'Car',
  fields: () => ({
    id: { type: GraphQLInt },
    brand: { type: GraphQLString },
    model: { type: GraphQLString },
    year: { type: GraphQLInt },
    color: { type: GraphQLString },
    fuel_type: { type: GraphQLString },
    transmission: { type: GraphQLString },
    seats: { type: GraphQLInt },
    price_per_day: { type: GraphQLFloat },
    image_url: { type: GraphQLString },
    available: { type: GraphQLBoolean },
    license_plate: { type: GraphQLString },
    mileage: { type: GraphQLInt },
    created_at: { type: GraphQLString },
    fullName: {
      type: GraphQLString,
      resolve: (car) => `${car.brand} ${car.model} (${car.year})`
    },
    category: {
      type: CategoryType,
      resolve: (car) => db('categories').where('id', car.category_id).first()
    },
    agency: {
      type: AgencyType,
      resolve: (car) => db('agencies').where('id', car.agency_id).first()
    },
    reviews: {
      type: new GraphQLList(ReviewType),
      resolve: (car) => db('reviews').where('car_id', car.id).orderBy('created_at', 'desc')
    },
    averageRating: {
      type: GraphQLFloat,
      resolve: (car) => db('reviews').where('car_id', car.id).avg('rating as avg').first().then(r => r.avg ? parseFloat(Number(r.avg).toFixed(1)) : null)
    },
    reviewCount: {
      type: GraphQLInt,
      resolve: (car) => db('reviews').where('car_id', car.id).count('* as cnt').first().then(r => r.cnt)
    },
    reservations: {
      type: new GraphQLList(ReservationType),
      resolve: (car) => db('reservations').where('car_id', car.id).orderBy('created_at', 'desc')
    }
  })
})

const CustomerType = new GraphQLObjectType({
  name: 'Customer',
  fields: () => ({
    id: { type: GraphQLInt },
    first_name: { type: GraphQLString },
    last_name: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    license_number: { type: GraphQLString },
    birth_date: { type: GraphQLString },
    created_at: { type: GraphQLString },
    fullName: {
      type: GraphQLString,
      resolve: (c) => `${c.first_name} ${c.last_name}`
    },
    reservations: {
      type: new GraphQLList(ReservationType),
      resolve: (c) => db('reservations').where('customer_id', c.id).orderBy('created_at', 'desc')
    },
    reviews: {
      type: new GraphQLList(ReviewType),
      resolve: (c) => db('reviews').where('customer_id', c.id).orderBy('created_at', 'desc')
    },
    totalReservations: {
      type: GraphQLInt,
      resolve: (c) => db('reservations').where('customer_id', c.id).count('* as cnt').first().then(r => r.cnt)
    },
    totalSpent: {
      type: GraphQLFloat,
      resolve: (c) => db('reservations').where('customer_id', c.id).whereNot('status', 'cancelled').sum('total_price as total').first().then(r => r.total || 0)
    }
  })
})

const ReservationType = new GraphQLObjectType({
  name: 'Reservation',
  fields: () => ({
    id: { type: GraphQLInt },
    start_date: { type: GraphQLString },
    end_date: { type: GraphQLString },
    total_price: { type: GraphQLFloat },
    status: { type: GraphQLString },
    notes: { type: GraphQLString },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
    days: {
      type: GraphQLInt,
      resolve: (r) => {
        const start = new Date(r.start_date)
        const end = new Date(r.end_date)
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      }
    },
    customer: {
      type: CustomerType,
      resolve: (r) => db('customers').where('id', r.customer_id).first()
    },
    car: {
      type: CarType,
      resolve: (r) => db('cars').where('id', r.car_id).first()
    }
  })
})

const AuthPayloadType = new GraphQLObjectType({
  name: 'AuthPayload',
  fields: {
    token: { type: GraphQLString },
    clientId: { type: GraphQLString },
    name: { type: GraphQLString },
    expiresIn: { type: GraphQLString }
  }
})

const StatsType = new GraphQLObjectType({
  name: 'Stats',
  fields: {
    totalCars: { type: GraphQLInt },
    availableCars: { type: GraphQLInt },
    totalCustomers: { type: GraphQLInt },
    totalReservations: { type: GraphQLInt },
    activeReservations: { type: GraphQLInt },
    totalRevenue: { type: GraphQLFloat },
    averageRating: { type: GraphQLFloat },
    totalReviews: { type: GraphQLInt }
  }
})

// ============ INPUT TYPES ============

const CarFilterInput = new GraphQLInputObjectType({
  name: 'CarFilter',
  fields: {
    brand: { type: GraphQLString },
    category_id: { type: GraphQLInt },
    agency_id: { type: GraphQLInt },
    fuel_type: { type: FuelTypeEnum },
    transmission: { type: TransmissionEnum },
    available: { type: GraphQLBoolean },
    min_price: { type: GraphQLFloat },
    max_price: { type: GraphQLFloat },
    min_year: { type: GraphQLInt },
    search: { type: GraphQLString }
  }
})

// ============ QUERIES ============

const QueryRoot = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    // Cars
    cars: {
      type: new GraphQLList(CarType),
      args: {
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
        sortBy: { type: GraphQLString, defaultValue: 'id' },
        sortOrder: { type: SortOrderEnum, defaultValue: 'asc' },
        filter: { type: CarFilterInput }
      },
      resolve: (_, args) => {
        let query = db('cars')
        const f = args.filter
        if (f) {
          if (f.brand) query = query.where('brand', 'like', `%${f.brand}%`)
          if (f.category_id) query = query.where('category_id', f.category_id)
          if (f.agency_id) query = query.where('agency_id', f.agency_id)
          if (f.fuel_type) query = query.where('fuel_type', f.fuel_type)
          if (f.transmission) query = query.where('transmission', f.transmission)
          if (f.available !== undefined) query = query.where('available', f.available)
          if (f.min_price) query = query.where('price_per_day', '>=', f.min_price)
          if (f.max_price) query = query.where('price_per_day', '<=', f.max_price)
          if (f.min_year) query = query.where('year', '>=', f.min_year)
          if (f.search) query = query.where(function() {
            this.where('brand', 'like', `%${f.search}%`)
                .orWhere('model', 'like', `%${f.search}%`)
                .orWhere('color', 'like', `%${f.search}%`)
          })
        }
        return query.orderBy(args.sortBy, args.sortOrder).limit(args.limit).offset(args.offset)
      }
    },
    car: {
      type: CarType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: (_, { id }) => db('cars').where('id', id).first()
    },
    // Categories
    categories: {
      type: new GraphQLList(CategoryType),
      resolve: () => db('categories').orderBy('id')
    },
    category: {
      type: CategoryType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: (_, { id }) => db('categories').where('id', id).first()
    },
    // Agencies
    agencies: {
      type: new GraphQLList(AgencyType),
      resolve: () => db('agencies').orderBy('id')
    },
    agency: {
      type: AgencyType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: (_, { id }) => db('agencies').where('id', id).first()
    },
    // Customers
    customers: {
      type: new GraphQLList(CustomerType),
      args: {
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
        search: { type: GraphQLString }
      },
      resolve: (_, args) => {
        let query = db('customers')
        if (args.search) {
          query = query.where(function() {
            this.where('first_name', 'like', `%${args.search}%`)
                .orWhere('last_name', 'like', `%${args.search}%`)
                .orWhere('email', 'like', `%${args.search}%`)
          })
        }
        return query.orderBy('id').limit(args.limit).offset(args.offset)
      }
    },
    customer: {
      type: CustomerType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: (_, { id }) => db('customers').where('id', id).first()
    },
    // Reservations
    reservations: {
      type: new GraphQLList(ReservationType),
      args: {
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
        status: { type: ReservationStatusEnum },
        customer_id: { type: GraphQLInt },
        car_id: { type: GraphQLInt },
        sortBy: { type: GraphQLString, defaultValue: 'created_at' },
        sortOrder: { type: SortOrderEnum, defaultValue: 'desc' }
      },
      resolve: (_, args) => {
        let query = db('reservations')
        if (args.status) query = query.where('status', args.status)
        if (args.customer_id) query = query.where('customer_id', args.customer_id)
        if (args.car_id) query = query.where('car_id', args.car_id)
        return query.orderBy(args.sortBy, args.sortOrder).limit(args.limit).offset(args.offset)
      }
    },
    reservation: {
      type: ReservationType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: (_, { id }) => db('reservations').where('id', id).first()
    },
    // Reviews
    reviews: {
      type: new GraphQLList(ReviewType),
      args: {
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
        car_id: { type: GraphQLInt },
        min_rating: { type: GraphQLInt },
        sortBy: { type: GraphQLString, defaultValue: 'created_at' },
        sortOrder: { type: SortOrderEnum, defaultValue: 'desc' }
      },
      resolve: (_, args) => {
        let query = db('reviews')
        if (args.car_id) query = query.where('car_id', args.car_id)
        if (args.min_rating) query = query.where('rating', '>=', args.min_rating)
        return query.orderBy(args.sortBy, args.sortOrder).limit(args.limit).offset(args.offset)
      }
    },
    // Stats
    stats: {
      type: StatsType,
      resolve: async () => {
        const [totalCars] = await db('cars').count('* as cnt')
        const [availableCars] = await db('cars').where('available', true).count('* as cnt')
        const [totalCustomers] = await db('customers').count('* as cnt')
        const [totalReservations] = await db('reservations').count('* as cnt')
        const [activeReservations] = await db('reservations').where('status', 'active').count('* as cnt')
        const [revenue] = await db('reservations').whereNot('status', 'cancelled').sum('total_price as total')
        const [avgRating] = await db('reviews').avg('rating as avg')
        const [totalReviews] = await db('reviews').count('* as cnt')

        return {
          totalCars: totalCars.cnt,
          availableCars: availableCars.cnt,
          totalCustomers: totalCustomers.cnt,
          totalReservations: totalReservations.cnt,
          activeReservations: activeReservations.cnt,
          totalRevenue: revenue.total || 0,
          averageRating: avgRating.avg ? parseFloat(parseFloat(avgRating.avg).toFixed(1)) : 0,
          totalReviews: totalReviews.cnt
        }
      }
    }
  })
})

// ============ MUTATIONS ============

const MutationRoot = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    // Auth
    login: {
      type: AuthPayloadType,
      args: {
        clientId: { type: new GraphQLNonNull(GraphQLString) },
        clientSecret: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: (_, { clientId, clientSecret }) => {
        const result = authenticateClient(clientId, clientSecret)
        if (!result) throw new Error('Invalid client credentials')
        return result
      }
    },

    // Cars
    createCar: {
      type: CarType,
      args: {
        brand: { type: new GraphQLNonNull(GraphQLString) },
        model: { type: new GraphQLNonNull(GraphQLString) },
        year: { type: new GraphQLNonNull(GraphQLInt) },
        color: { type: GraphQLString },
        fuel_type: { type: FuelTypeEnum },
        transmission: { type: TransmissionEnum },
        seats: { type: GraphQLInt },
        price_per_day: { type: new GraphQLNonNull(GraphQLFloat) },
        image_url: { type: GraphQLString },
        license_plate: { type: GraphQLString },
        mileage: { type: GraphQLInt },
        category_id: { type: new GraphQLNonNull(GraphQLInt) },
        agency_id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve: async (_, args, context) => {
        requireAuth(context)
        const [id] = await db('cars').insert(args)
        return db('cars').where('id', id).first()
      }
    },
    updateCar: {
      type: CarType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        brand: { type: GraphQLString },
        model: { type: GraphQLString },
        year: { type: GraphQLInt },
        color: { type: GraphQLString },
        fuel_type: { type: FuelTypeEnum },
        transmission: { type: TransmissionEnum },
        seats: { type: GraphQLInt },
        price_per_day: { type: GraphQLFloat },
        image_url: { type: GraphQLString },
        available: { type: GraphQLBoolean },
        license_plate: { type: GraphQLString },
        mileage: { type: GraphQLInt },
        category_id: { type: GraphQLInt },
        agency_id: { type: GraphQLInt }
      },
      resolve: async (_, args, context) => {
        requireAuth(context)
        const { id, ...updates } = args
        // Remove undefined values
        Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])
        const car = await db('cars').where('id', id).first()
        if (!car) throw new Error('Car not found')
        await db('cars').where('id', id).update(updates)
        const updated = await db('cars').where('id', id).first()
        if (car.available !== updated.available) {
          pubsub.publish(EVENTS.CAR_AVAILABILITY_CHANGED, { carAvailabilityChanged: updated })
        }
        return updated
      }
    },
    deleteCar: {
      type: CarType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (_, { id }, context) => {
        requireAuth(context)
        const car = await db('cars').where('id', id).first()
        if (!car) throw new Error('Car not found')
        await db('cars').where('id', id).del()
        return car
      }
    },

    // Customers
    createCustomer: {
      type: CustomerType,
      args: {
        first_name: { type: new GraphQLNonNull(GraphQLString) },
        last_name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        phone: { type: GraphQLString },
        license_number: { type: GraphQLString },
        birth_date: { type: GraphQLString }
      },
      resolve: async (_, args, context) => {
        requireAuth(context)
        const [id] = await db('customers').insert(args)
        return db('customers').where('id', id).first()
      }
    },
    updateCustomer: {
      type: CustomerType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        first_name: { type: GraphQLString },
        last_name: { type: GraphQLString },
        email: { type: GraphQLString },
        phone: { type: GraphQLString },
        license_number: { type: GraphQLString },
        birth_date: { type: GraphQLString }
      },
      resolve: async (_, args, context) => {
        requireAuth(context)
        const { id, ...updates } = args
        Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])
        await db('customers').where('id', id).update(updates)
        return db('customers').where('id', id).first()
      }
    },
    deleteCustomer: {
      type: CustomerType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (_, { id }, context) => {
        requireAuth(context)
        const customer = await db('customers').where('id', id).first()
        if (!customer) throw new Error('Customer not found')
        await db('customers').where('id', id).del()
        return customer
      }
    },

    // Reservations
    createReservation: {
      type: ReservationType,
      args: {
        customer_id: { type: new GraphQLNonNull(GraphQLInt) },
        car_id: { type: new GraphQLNonNull(GraphQLInt) },
        start_date: { type: new GraphQLNonNull(GraphQLString) },
        end_date: { type: new GraphQLNonNull(GraphQLString) },
        notes: { type: GraphQLString }
      },
      resolve: async (_, args, context) => {
        requireAuth(context)
        const car = await db('cars').where('id', args.car_id).first()
        if (!car) throw new Error('Car not found')
        if (!car.available) throw new Error('Car is not available')

        const start = new Date(args.start_date)
        const end = new Date(args.end_date)
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        if (days <= 0) throw new Error('End date must be after start date')

        const total_price = days * car.price_per_day

        const [id] = await db('reservations').insert({
          ...args,
          total_price,
          status: 'pending'
        })

        // Mark car as unavailable
        await db('cars').where('id', args.car_id).update({ available: false })

        const reservation = await db('reservations').where('id', id).first()

        pubsub.publish(EVENTS.RESERVATION_CREATED, { reservationCreated: reservation })
        pubsub.publish(EVENTS.CAR_AVAILABILITY_CHANGED, { carAvailabilityChanged: { ...car, available: false } })

        return reservation
      }
    },
    updateReservationStatus: {
      type: ReservationType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        status: { type: new GraphQLNonNull(ReservationStatusEnum) }
      },
      resolve: async (_, { id, status }, context) => {
        requireAuth(context)
        const reservation = await db('reservations').where('id', id).first()
        if (!reservation) throw new Error('Reservation not found')

        // Validate state transitions
        const validTransitions = {
          pending: ['confirmed', 'cancelled'],
          confirmed: ['active', 'cancelled'],
          active: ['completed', 'cancelled'],
          completed: [],
          cancelled: []
        }
        if (!validTransitions[reservation.status]?.includes(status)) {
          throw new Error(`Cannot transition from '${reservation.status}' to '${status}'`)
        }

        await db('reservations').where('id', id).update({ status })

        // If cancelled or completed, make car available again
        if (status === 'cancelled' || status === 'completed') {
          await db('cars').where('id', reservation.car_id).update({ available: true })
          const car = await db('cars').where('id', reservation.car_id).first()
          pubsub.publish(EVENTS.CAR_AVAILABILITY_CHANGED, { carAvailabilityChanged: car })
        }

        const updated = await db('reservations').where('id', id).first()
        pubsub.publish(EVENTS.RESERVATION_STATUS_CHANGED, { reservationStatusChanged: updated })

        return updated
      }
    },
    cancelReservation: {
      type: ReservationType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (_, { id }, context) => {
        requireAuth(context)
        const reservation = await db('reservations').where('id', id).first()
        if (!reservation) throw new Error('Reservation not found')
        if (['completed', 'cancelled'].includes(reservation.status)) {
          throw new Error(`Cannot cancel a ${reservation.status} reservation`)
        }
        await db('reservations').where('id', id).update({ status: 'cancelled' })
        await db('cars').where('id', reservation.car_id).update({ available: true })

        const updated = await db('reservations').where('id', id).first()
        const car = await db('cars').where('id', reservation.car_id).first()

        pubsub.publish(EVENTS.RESERVATION_STATUS_CHANGED, { reservationStatusChanged: updated })
        pubsub.publish(EVENTS.CAR_AVAILABILITY_CHANGED, { carAvailabilityChanged: car })

        return updated
      }
    },

    // Reviews
    createReview: {
      type: ReviewType,
      args: {
        customer_id: { type: new GraphQLNonNull(GraphQLInt) },
        car_id: { type: new GraphQLNonNull(GraphQLInt) },
        rating: { type: new GraphQLNonNull(GraphQLInt) },
        comment: { type: GraphQLString }
      },
      resolve: async (_, args, context) => {
        requireAuth(context)
        if (args.rating < 1 || args.rating > 5) throw new Error('Rating must be between 1 and 5')
        const [id] = await db('reviews').insert(args)
        const review = await db('reviews').where('id', id).first()
        pubsub.publish(EVENTS.REVIEW_ADDED, { reviewAdded: review })
        return review
      }
    },
    deleteReview: {
      type: ReviewType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (_, { id }, context) => {
        requireAuth(context)
        const review = await db('reviews').where('id', id).first()
        if (!review) throw new Error('Review not found')
        await db('reviews').where('id', id).del()
        return review
      }
    }
  })
})

// ============ SUBSCRIPTIONS ============

const SubscriptionRoot = new GraphQLObjectType({
  name: 'Subscription',
  fields: () => ({
    reservationCreated: {
      type: ReservationType,
      subscribe: () => pubsub.asyncIterator([EVENTS.RESERVATION_CREATED])
    },
    reservationStatusChanged: {
      type: ReservationType,
      subscribe: () => pubsub.asyncIterator([EVENTS.RESERVATION_STATUS_CHANGED])
    },
    reviewAdded: {
      type: ReviewType,
      subscribe: () => pubsub.asyncIterator([EVENTS.REVIEW_ADDED])
    },
    carAvailabilityChanged: {
      type: CarType,
      subscribe: () => pubsub.asyncIterator([EVENTS.CAR_AVAILABILITY_CHANGED])
    }
  })
})

// ============ SCHEMA ============

export const carRentalSchema = new GraphQLSchema({
  query: QueryRoot,
  mutation: MutationRoot,
  subscription: SubscriptionRoot
})
