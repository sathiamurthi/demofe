let sample = {
    data: [
      {
        "email": `sans@email.com`,
        "timeSheet": [
          {
            "ordinal": 16,
            "year": 2023,
            "projects": [
              {
                "name": "Bulkmatic ",
                "hours": 9,
              },
              {
                "name": "Ssense",
                "hours": 8,
              },
            ],
          },
        ],
      },
    ],
  };
  
  let projectList = [
    "Bulkmatic",
    "SSENSE",
    "Thomson Reuters",
    "Frontier PTS",
    "Leaps",
    "Timesheet",
  ];
  
  let emailList = [
    "nishan.goswami@test.com",
    "panchakshari.bm@test.com",
    "nurul.ansar@test.com",
    "komal.n@test.com",
    "mallikarjun.n@test.com",
  ];
  
  let ordinalFrom = 10;
  let ordinalTo = 30;
  

  let maxArrayCount = ordinalTo - ordinalFrom

  //generate an array from ordinalFrom to ordinalTo
  let ordinalArray = Array.from(
    { length: ordinalTo - ordinalFrom },
    (v, k) => k + ordinalFrom
  );
  

  let currentYear = 2023;
  let data = [];
  
  //loop through each email
  for (let i = 0; i < emailList.length; i++) {
    let email = emailList[i];
    let timeSheet = [];


    let ordinalCount = Math.round(Math.floor(Math.random() * (maxArrayCount - ordinalFrom + 1)) + ordinalFrom);

    let currentuserOrdinalArray = ordinalArray
    .sort(() => Math.random() - 0.5)
    .slice(0, ordinalCount).sort();

    //loop through ordinalArray
    for (let j = 0; j < currentuserOrdinalArray.length; j++) {
      let ordinal = currentuserOrdinalArray[j];
      let projects = [];
  
      //choose any 3 projects from projectList
      let projectListForUser = projectList
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
  
      //loop through each project
      for (let k = 0; k < projectListForUser.length; k++) {
        let name = projectListForUser[k];
        let hours = Math.floor(Math.random() * (8 - 1 + 1) + 1);
        projects.push({ name, hours });
      }
      timeSheet.push({ ordinal, year: currentYear, projects });
    }
    data.push({ email, timeSheet });
  }
  

 //write data to json file
 const fs = require('fs'); 
 fs.writeFileSync('././src/_mock/sampleData.json', JSON.stringify(data, null, 4));
  