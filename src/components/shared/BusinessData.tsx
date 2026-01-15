export const businessData = {
  name: "Business Name",
  logo: "", // URL to logo image or empty for placeholder
  tagline: "Tagline or short description of the business goes here.",
  phone: "(123) 456-7890",
  email: "test@gmail.com",
  
  socialMedia: {
    facebook: "#",
    twitter: "#",
    instagram: "#",
    linkedin: "#"
  },
  
  about: "Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum eveniet ea inventore voluptates aut ipsam voluptatem.",
  
  businessHours: [
    { day: "Sunday", time: "10 AM – 6 PM" },
    { day: "Monday", time: "10 AM – 6 PM" },
    { day: "Tuesday", time: "10 AM – 6 PM" },
    { day: "Wednesday", time: "10 AM – 6 PM" },
    { day: "Thursday", time: "10 AM – 6 PM" },
    { day: "Friday", time: "10 AM – 6 PM" },
    { day: "Saturday", time: "10 AM – 6 PM" }
  ],
  
  timezone: "Philippine Standard Time",
  
  location: "Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum evenie."
};

// You can also export individual pieces if needed
export const getBusinessName = () => businessData.name;
export const getContactInfo = () => ({
  phone: businessData.phone,
  email: businessData.email
});
export const getBusinessHours = () => businessData.businessHours;