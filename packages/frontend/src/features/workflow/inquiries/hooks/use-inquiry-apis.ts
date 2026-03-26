import { inquiryScheduleApi, inquiriesApi } from '../api';

export function useInquiryApis() {
    return {
        inquiriesApi,
        inquiryScheduleApi,
    };
}
