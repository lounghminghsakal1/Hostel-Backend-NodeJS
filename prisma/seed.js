import { prisma } from "../src/configs/db.js";


async function main() {
  
  const roles = [
   "STUDENT", "HOSTEL_ADMIN"
  ];

  for(const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: {
        roleName: role
      },
      update: {},
      create: {
        roleName: role
      }
    });
  }
  
  const college = await prisma.college.upsert({
    where: {
      collegeName: "St. Joseph's College Autonomous Tiruchirappalli"
    }, 
    update: {},
    create: {
      collegeName: "St. Joseph's College Autonomous Tiruchirappalli",
      location: "Tiruchirappalli",
      contactPersonName: "Mariadoss",
      contactNumber: "9898989034",
    }
  });

  const hostel = await prisma.hostel.upsert({
    where: {
      collegeId_hostelName: {
        collegeId: college.id,
        hostelName: "New Hostel (NH)"
      }
    },
    update: {},
    create: {
      hostelName: "New Hostel (NH)",
      location: "Tiruchirappalli",
      latitude: 10.830756,
      longitude: 78.689962,
      contactPersonName: "Rev.Fr. Paul raj",
      contactNumber: "8876873479",

      collegeId: college.id
    }
  });

  const department = await prisma.department.upsert({
    where: {
      collegeId_departmentName: {
        collegeId: college.id,
        departmentName: "Computer Science"
      }
    },
    update: {},
    create: {
      departmentName: "Computer Science",
      hodName: "Britto",
      contactPersonName: "Jude Nirmal",
      contactNumber: "9845458757",

      collegeId: college.id
    }
  });

  const room = await prisma.room.upsert({
    where: {
      hostelId_roomNumber: {
        hostelId: hostel.id,
        roomNumber: "NH-3-118",
      }
    },
    update: {},
    create: {
      roomNumber: "NH-3-118",
      capacity: 3,
      hostelId: hostel.id
    }
  });

  const hostelAdminRole = await prisma.role.upsert({
    where: {
      roleName: "HOSTEL_ADMIN"
    },
    update: {},
    create: {
      roleName: "HOSTEL_ADMIN"
    }
  });

  const user = await prisma.user.upsert({
    where: {
      email: "sushvinth@gmail.com"
    },
    update: {},
    create: {
      email: "sushvinth@gmail.com",
      passwordHash: "$2a$12$7qtImmU60KkPBrvXRcsj2.FpAQXQTW92RZ/eROYzyPXcffDhUAKpa",
      status: "ACTIVE",
      roleId: hostelAdminRole.id,  //the above hostelAdminRole query is just for to use it here
      collegeId: college.id
    }
  });

  const hostelAdminProfile = await prisma.hostelAdminProfile.upsert({
    where: {
      contactNumber: "9898873443",
    },
    update: {},
    create: {
      hostelAdminName: "Sushvinth",
      contactNumber: "9898873443",
      userId: user.id,
      hostelId: hostel.id,
      collegeId: college.id
    }
  });

};


main()
  .then(() => console.log("Database seeded with initial data successfully"))
  .catch(err => console.error(err))
  .finally(async () => await prisma.$disconnect());
  