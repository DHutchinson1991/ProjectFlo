export enum ProjectPhase {
    Lead = 'Lead',
    Inquiry = 'Inquiry',
    Booking = 'Booking',
    Creative_Development = 'Creative_Development',
    Pre_Production = 'Pre_Production',
    Production = 'Production',
    Post_Production = 'Post_Production'
}

export enum PricingType {
    Hourly = 'Hourly',
    Fixed = 'Fixed'
}

export enum TaskTriggerType {
    always = 'always',
    per_project = 'per_project',
    per_film = 'per_film',
    per_film_with_music = 'per_film_with_music',
    per_film_with_graphics = 'per_film_with_graphics',
    per_event_day = 'per_event_day',
    per_crew = 'per_crew',
    per_location = 'per_location',
    per_activity = 'per_activity',
    per_activity_crew = 'per_activity_crew',
    per_film_scene = 'per_film_scene',
}

export enum DueDateOffsetReference {
    inquiry_created = 'inquiry_created',
    booking_date = 'booking_date',
    event_date = 'event_date',
    delivery_date = 'delivery_date',
}
