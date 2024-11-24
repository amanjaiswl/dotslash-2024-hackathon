import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import session from "express-session";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import { format } from "date-fns";
import multer from "multer";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

const companyData = path.join(__dirname, "company-data.json");
const curatorData = path.join(__dirname, "curator-data.json");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, "dist")));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "hello-this-is-not-for-production",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  }),
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

let db;
(async () => {
  db = await open({
    filename: path.join(__dirname, "database.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      company_id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT,
      website TEXT,
      industry TEXT,
      range TEXT,
      description TEXT,
      contact_name TEXT,
      email TEXT,
      password TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS curators (
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone_number TEXT,
      languages TEXT,
      education_expr TEXT,
      password TEXT
    )
  `);
})();

app.get("/", (req, res) => {
  return res.render("index");
});

app.get("/get-started", (req, res) => {
  return res.render("get-started");
});

app.get("/company-signup", (req, res) => {
  return res.render("company-signup");
});

app.post("/register-company", async (req, res) => {
  const {
    company_name,
    website,
    industry,
    company_size,
    description,
    contact_name,
    email,
    password,
    confirm_password,
  } = req.body;

  if (
    !company_name ||
    !industry ||
    !company_size ||
    !contact_name ||
    !email ||
    !password ||
    !confirm_password
  ) {
    return res.status(400).send("All fields are required.");
  }

  if (password !== confirm_password) {
    return res.status(400).send("Passwords do not match.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      `INSERT INTO companies (company_name, website, industry, range, description, contact_name, email, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_name,
        website,
        industry,
        company_size,
        description,
        contact_name,
        email,
        hashedPassword,
      ],
    );

    const companyId = result.lastID;
    const company = await db.get(
      `SELECT * FROM companies WHERE company_id = ?`,
      [companyId],
    );

    const now = new Date();
    const formattedDate = format(now, "dd MMMM yyyy");
    const formattedTime = format(now, "HH:mm:ss");

    const dashboardData = {
      company: {
        name: company.company_name,
        logo: "ai-vector.jpg",
      },
      stats: {
        activeTasks: 0,
        completionPercentage: 2,
        shortlisted: 0,
        timeSaved: 1.5,
      },
      recentActivity: [
        {
          userImage: "openai.png",
          message: "Welcome to Bridge Solutions!",
          time: formattedDate + " at " + formattedTime,
        },
      ],
      activeTasks: [],
      submissions: [],
      approvedSubmissions: [],
      rejectedSubmissions: [],
    };

    try {
      const data = await fs.readFile(companyData, "utf8");
      let fileJsonData = JSON.parse(data);

      fileJsonData.push(dashboardData);

      await fs.writeFile(
        companyData,
        JSON.stringify(fileJsonData, null, 2),
        "utf8",
      );
    } catch (err) {
      console.error("Error writing to file:", err);
      return res.status(500).json({ error: "Failed to write file" });
    }

    req.session.companyId = companyId;
    // return res.render("company-dashboard", dashboardData);
    return res.redirect("/company-dashboard");
  } catch (error) {
    console.error("Error registering company:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/curator-signup", (req, res) => {
  return res.render("curator-signup");
});

app.post("/register-curator", async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    skills,
    education_expr,
    password,
    confirm_password,
  } = req.body;

  // Validate form data
  if (
    !first_name ||
    !last_name ||
    !email ||
    !education_expr ||
    !password ||
    !confirm_password
  ) {
    return res.status(400).send("All fields are required.");
  }

  if (password !== confirm_password) {
    return res.status(400).send("Passwords do not match.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      `INSERT INTO curators (first_name, last_name, email, phone_number, languages, education_expr, password)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        email,
        phone,
        skills,
        education_expr,
        hashedPassword,
      ],
    );

    const curator = await db.get(`SELECT * FROM curators WHERE email = ?`, [
      email,
    ]);

    const newCuratorData = {
      curator: {
        name: curator.first_name + " " + curator.last_name,
        profilePicture: "mountains.jpeg",
        rank: "Newbie Curator",
      },
      stats: {
        totalWorkDone: 0,
        workDone: 0,
        workAssigned: 0,
        totalEarnings: 0,
        todayEarnings: 0,
      },
      assignedWork: [],
      completedWork: [],
    };

    try {
      const data = await fs.readFile(curatorData, "utf8");
      let fileJsonData = JSON.parse(data);

      fileJsonData.push(newCuratorData);

      await fs.writeFile(
        curatorData,
        JSON.stringify(fileJsonData, null, 2),
        "utf8",
      );
    } catch (err) {
      console.error("Error writing to file:", err);
      return res.status(500).json({ error: "Failed to write file" });
    }
    const curatorId = result.lastID;
    req.session.curatorId = curatorId;
    // return res.render("curator-dashboard", newCuratorData);
    return res.redirect("/curator-dashboard");
  } catch (error) {
    console.error("Error registering curator:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/login", (req, res) => {
  return res.render("login");
});

app.post("/login-company", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  try {
    const company = await db.get(`SELECT * FROM companies WHERE email = ?`, [
      email,
    ]);

    if (!company) {
      return res.status(400).send("Invalid email or password.");
    }

    const isPasswordValid = await bcrypt.compare(password, company.password);

    if (!isPasswordValid) {
      return res.status(400).send("Invalid email or password.");
    }

    req.session.companyId = company.company_id;

    const stats = {
      activeTasks: 0,
      completionPercentage: 0,
      shortlisted: 0,
      timeSaved: 0,
    };

    try {
      const data = await fs.readFile(companyData, "utf8");
      const fileJsonData = JSON.parse(data);

      const companyDashboardData = fileJsonData.find(
        (item) => item.company.name === company.company_name,
      );

      if (!companyDashboardData) {
        return res.status(404).send("Company data not found.");
      }

      // return res.render("company-dashboard", companyDashboardData);
      return res.redirect("/company-dashboard");
    } catch (err) {
      console.error("Error reading from file:", err);
      return res.status(500).json({ error: "Failed to read file" });
    }
  } catch (error) {
    console.error("Error logging in company:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/login-curator", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  try {
    const curator = await db.get(`SELECT * FROM curators WHERE email = ?`, [
      email,
    ]);

    if (!curator) {
      return res.status(400).send("Invalid email or password.");
    }

    const isPasswordValid = await bcrypt.compare(password, curator.password);

    if (!isPasswordValid) {
      return res.status(400).send("Invalid email or password.");
    }

    req.session.curatorId = curator.curator_id;

    try {
      const data = await fs.readFile(curatorData, "utf8");
      const fileJsonData = JSON.parse(data);

      const curatorDashboardData = fileJsonData.find(
        (item) =>
          item.curator.name === `${curator.first_name} ${curator.last_name}`,
      );

      if (!curatorDashboardData) {
        return res.status(404).send("Curator data not found.");
      }

      return res.render("curator-dashboard", curatorDashboardData);
    } catch (err) {
      console.error("Error reading from file:", err);
      return res.status(500).json({ error: "Failed to read file" });
    }
  } catch (error) {
    console.error("Error logging in curator:", error);
    return res.status(500).send("Internal Server Error");
  }
});

function checkCompanyLogin(req, res, next) {
  if (!req.session.companyId) {
    return res.redirect("/login");
  }
  next();
}

function checkCuratorLogin(req, res, next) {
  if (!req.session.curatorId) {
    return res.redirect("/login");
  }
  next();
}

app.get("/company-dashboard", checkCompanyLogin, async (req, res) => {
  try {
    const data = await fs.readFile(companyData, "utf8");
    const fileJsonData = JSON.parse(data);

    const company = await db.get(
      `SELECT * FROM companies WHERE company_id = ?`,
      [req.session.companyId],
    );

    const companyDashboardData = fileJsonData.find(
      (item) => item.company.name === company.company_name,
    );

    if (!companyDashboardData) {
      return res.status(404).send("Company data not found.");
    }

    return res.render("company-dashboard", companyDashboardData);
  } catch (err) {
    console.error("Error reading from file:", err);
    return res.status(500).json({ error: "Failed to read file" });
  }
});

app.get("/curator-dashboard", checkCuratorLogin, async (req, res) => {
  try {
    const data = await fs.readFile(curatorData, "utf8");
    const fileJsonData = JSON.parse(data);

    const curator = await db.get(
      `SELECT * FROM curators WHERE curator_id = ?`,
      [req.session.curatorId],
    );

    const curatorDashboardData = fileJsonData.find(
      (item) =>
        item.curator.name === `${curator.first_name} ${curator.last_name}`,
    );

    if (!curatorDashboardData) {
      return res.status(404).send("Curator data not found.");
    }

    return res.render("curator-dashboard", curatorDashboardData);
  } catch (err) {
    console.error("Error reading from file:", err);
    return res.status(500).json({ error: "Failed to read file" });
  }
});

app.get("/post-new-job", (req, res) => {
  return res.render("post-new-job");
});

app.post(
  "/submit-post-new-job",
  checkCompanyLogin,
  upload.array("dataFiles"),
  async (req, res) => {
    const { jobTitle, jobCategory, jobDescription, deadline } = req.body;
    const files = req.files;

    if (
      !jobTitle ||
      !jobCategory ||
      !jobDescription ||
      !deadline ||
      files.length === 0
    ) {
      return res.status(400).send("All fields are required.");
    }

    try {
      const company = await db.get(
        `SELECT * FROM companies WHERE company_id = ?`,
        [req.session.companyId],
      );

      const now = new Date();
      const formattedDate = format(now, "dd MMMM yyyy");
      const formattedTime = format(now, "HH:mm:ss");

      const newJob = {
        title: jobTitle,
        category: jobCategory,
        description: jobDescription,
        deadline: deadline,
        payment: 50.0,
        status: "In Progress",
        files: files.map((file) => `/uploads/${file.filename}`),
        createdAt: formattedDate + " at " + formattedTime,
        applications: 0,
      };

      const data = await fs.readFile(companyData, "utf8");
      let fileJsonData = JSON.parse(data);

      const companyDashboardData = fileJsonData.find(
        (item) => item.company.name === company.company_name,
      );

      if (!companyDashboardData) {
        return res.status(404).send("Company data not found.");
      }

      companyDashboardData.activeTasks.push(newJob);

      // Assign job to curators equally
      const curatorsData = await fs.readFile(curatorData, "utf8");
      let curatorsJsonData = JSON.parse(curatorsData);

      curatorsJsonData.forEach((curator) => {
        if (!curator.assignedWork) {
          curator.assignedWork = [];
        }
        curator.assignedWork.push(newJob);
        curator.stats.workAssigned += newJob.files.length;
      });

      await fs.writeFile(
        companyData,
        JSON.stringify(fileJsonData, null, 2),
        "utf8",
      );

      await fs.writeFile(
        curatorData,
        JSON.stringify(curatorsJsonData, null, 2),
        "utf8",
      );

      return res.redirect("/company-dashboard");
    } catch (err) {
      console.error("Error posting new job:", err);
      return res.status(500).send("Internal Server Error");
    }
  },
);

app.post("/submit-work", checkCuratorLogin, async (req, res) => {
  const { workId, description } = req.body;

  try {
    const curator = await db.get(
      `SELECT * FROM curators WHERE curator_id = ?`,
      [req.session.curatorId],
    );

    const data = await fs.readFile(companyData, "utf8");
    let fileJsonData = JSON.parse(data);

    const companyDashboardData = fileJsonData.find((item) =>
      item.activeTasks.some((task) => task.id === workId),
    );

    if (!companyDashboardData) {
      return res.status(404).send("Company data not found.");
    }

    const task = companyDashboardData.activeTasks.find(
      (task) => task.id === workId,
    );
    const now = new Date();
    const formattedDate = format(now, "dd MMMM yyyy");
    const formattedTime = format(now, "HH:mm:ss");

    const newSubmission = {
      id: Date.now(),
      title: task.title,
      description: description,
      curator: `${curator.first_name} ${curator.last_name}`,
      date: formattedDate + " at " + formattedTime,
      files: task.files,
    };

    if (!companyDashboardData.submissions) {
      companyDashboardData.submissions = [];
    }

    companyDashboardData.submissions.push(newSubmission);

    await fs.writeFile(
      companyData,
      JSON.stringify(fileJsonData, null, 2),
      "utf8",
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error submitting work:", err);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/approve-submission", checkCompanyLogin, async (req, res) => {
  const { submissionId } = req.body;

  try {
    const data = await fs.readFile(companyData, "utf8");
    let fileJsonData = JSON.parse(data);

    const companyDashboardData = fileJsonData.find((item) =>
      item.submissions.some((submission) => submission.id === submissionId),
    );

    if (!companyDashboardData) {
      return res.status(404).send("Company data not found.");
    }

    const submission = companyDashboardData.submissions.find(
      (submission) => submission.id === submissionId,
    );
    const now = new Date();
    const formattedDate = format(now, "dd MMMM yyyy");

    const approvedSubmission = {
      ...submission,
      approvalDate: formattedDate,
    };

    if (!companyDashboardData.approvedSubmissions) {
      companyDashboardData.approvedSubmissions = [];
    }

    companyDashboardData.approvedSubmissions.push(approvedSubmission);
    companyDashboardData.submissions = companyDashboardData.submissions.filter(
      (submission) => submission.id !== submissionId,
    );

    await fs.writeFile(
      companyData,
      JSON.stringify(fileJsonData, null, 2),
      "utf8",
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error approving submission:", err);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/reject-submission", checkCompanyLogin, async (req, res) => {
  const { submissionId } = req.body;

  try {
    const data = await fs.readFile(companyData, "utf8");
    let fileJsonData = JSON.parse(data);

    const companyDashboardData = fileJsonData.find((item) =>
      item.submissions.some((submission) => submission.id === submissionId),
    );

    if (!companyDashboardData) {
      return res.status(404).send("Company data not found.");
    }

    const submission = companyDashboardData.submissions.find(
      (submission) => submission.id === submissionId,
    );
    const now = new Date();
    const formattedDate = format(now, "dd MMMM yyyy");

    const rejectedSubmission = {
      ...submission,
      rejectionDate: formattedDate,
    };

    if (!companyDashboardData.rejectedSubmissions) {
      companyDashboardData.rejectedSubmissions = [];
    }

    companyDashboardData.rejectedSubmissions.push(rejectedSubmission);
    companyDashboardData.submissions = companyDashboardData.submissions.filter(
      (submission) => submission.id !== submissionId,
    );

    await fs.writeFile(
      companyData,
      JSON.stringify(fileJsonData, null, 2),
      "utf8",
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error rejecting submission:", err);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/revert-submission", checkCompanyLogin, async (req, res) => {
  const { submissionId } = req.body;

  try {
    const data = await fs.readFile(companyData, "utf8");
    let fileJsonData = JSON.parse(data);

    const companyDashboardData = fileJsonData.find(
      (item) =>
        item.approvedSubmissions.some(
          (submission) => submission.id === submissionId,
        ) ||
        item.rejectedSubmissions.some(
          (submission) => submission.id === submissionId,
        ),
    );

    if (!companyDashboardData) {
      return res.status(404).send("Company data not found.");
    }

    let submission;
    if (
      companyDashboardData.approvedSubmissions.some(
        (submission) => submission.id === submissionId,
      )
    ) {
      submission = companyDashboardData.approvedSubmissions.find(
        (submission) => submission.id === submissionId,
      );
      companyDashboardData.approvedSubmissions =
        companyDashboardData.approvedSubmissions.filter(
          (submission) => submission.id !== submissionId,
        );
    } else {
      submission = companyDashboardData.rejectedSubmissions.find(
        (submission) => submission.id === submissionId,
      );
      companyDashboardData.rejectedSubmissions =
        companyDashboardData.rejectedSubmissions.filter(
          (submission) => submission.id !== submissionId,
        );
    }

    if (!companyDashboardData.submissions) {
      companyDashboardData.submissions = [];
    }

    companyDashboardData.submissions.push(submission);

    await fs.writeFile(
      companyData,
      JSON.stringify(fileJsonData, null, 2),
      "utf8",
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error reverting submission:", err);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/submit-work", checkCuratorLogin, async (req, res) => {
  const { workId, description } = req.body;

  try {
    const curator = await db.get(
      `SELECT * FROM curators WHERE curator_id = ?`,
      [req.session.curatorId],
    );

    const data = await fs.readFile(companyData, "utf8");
    let fileJsonData = JSON.parse(data);

    const companyDashboardData = fileJsonData.find((item) =>
      item.activeTasks.some((task) => task.id === workId),
    );

    if (!companyDashboardData) {
      return res.status(404).send("Company data not found.");
    }

    const task = companyDashboardData.activeTasks.find(
      (task) => task.id === workId,
    );
    const now = new Date();
    const formattedDate = format(now, "dd MMMM yyyy");
    const formattedTime = format(now, "HH:mm:ss");

    const newSubmission = {
      id: Date.now(),
      title: task.title,
      description: description,
      curator: `${curator.first_name} ${curator.last_name}`,
      date: formattedDate + " at " + formattedTime,
      files: task.files,
    };

    if (!companyDashboardData.submissions) {
      companyDashboardData.submissions = [];
    }

    companyDashboardData.submissions.push(newSubmission);

    await fs.writeFile(
      companyData,
      JSON.stringify(fileJsonData, null, 2),
      "utf8",
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error submitting work:", err);
    return res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
