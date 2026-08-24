import { prisma } from "../../configs/db.js";

const findHostelById = async (hostelId) => {
  return await prisma.hostel.findUnique({
    where: {
      id: hostelId
    }
  });
};

const findHostelByHostelNameAndCollegeId = async (hostelName, collegeId) => {
  return await prisma.hostel.findUnique({
    where: {
      collegeId_hostelName: {
        collegeId: collegeId,
        hostelName: hostelName
      }
    }
  });
};

const updateHostel = async (hostelId, hostelName, location, latitude, longitude, contactPersonName, contactNumber) => {
  return await prisma.hostel.update({
    where: {
      id: hostelId
    },
    data: {
      hostelName: hostelName ?? undefined,
      location: location ?? undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      contactPersonName: contactPersonName ?? undefined,
      contactNumber: contactNumber ?? undefined
    }
  });
};  

const getAllHostelsOfTheCollege = async (collegeId) => {
  return await prisma.hostel.findMany({
    where: {
      collegeId: collegeId
    }
  });
};

const HostelRepository = {
  findHostelById,
  findHostelByHostelNameAndCollegeId,
  updateHostel,
  getAllHostelsOfTheCollege
};

export default HostelRepository;