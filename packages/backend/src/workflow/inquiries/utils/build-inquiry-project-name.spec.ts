import { buildInquiryProjectName } from './build-inquiry-project-name';

describe('buildInquiryProjectName', () => {
  it('uses the inquiry event category instead of always assuming Wedding', () => {
    expect(buildInquiryProjectName('Alex', 'Jordan', 'Birthday')).toBe("Alex & Jordan's Birthday");
  });

  it('defaults to Wedding when event category is blank', () => {
    expect(buildInquiryProjectName('Alex', 'Jordan', '   ')).toBe("Alex & Jordan's Wedding");
    expect(buildInquiryProjectName('Alex', 'Jordan', null)).toBe("Alex & Jordan's Wedding");
  });

  it('handles single-name contacts', () => {
    expect(buildInquiryProjectName('Alex', null, 'Corporate')).toBe("Alex's Corporate");
  });

  it('handles missing names gracefully', () => {
    expect(buildInquiryProjectName(null, null, 'Wedding')).toBe("'s Wedding");
  });
});
