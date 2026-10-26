import { prisma } from "../../configs/db.js";

const getHostelAdminProfile = async (id) => {
  return await prisma.hostelAdminProfile.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      hostelAdminName: true,
      hostel: {
        select: {
          hostelName: true
        }
      },
      college: {
        select: {
          collegeName: true
        }
      }
    },
  });
};

const HostelAdminRepository = {
  getHostelAdminProfile
};

export default HostelAdminRepository;

