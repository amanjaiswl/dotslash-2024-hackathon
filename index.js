import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import session from "express-session";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

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

  // await db.exec(`
  //   CREATE TABLE IF NOT EXISTS workers (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT,
  //   )
  // `);
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

app.get("/curator-signup", (req, res) => {
  return res.render("curator-signup");
});

app.get("/login", (req, res) => {
  return res.render("login");
});

app.get("/company-dashboard", (req, res) => {
  return res.render("company-dashboard", {
    company: {
      name: "OpenAI",
      logo: "openai.png",
    },
    stats: {
      activeTasks: 1,
      completionPercentage: 26,
      shortlisted: 1,
      timeSaved: 12.5,
    },
    recentActivity: [
      {
        userImage: "openai.png",
        message: "Image Recognition Model Labeling has been approved by system",
        time: "10:11:29",
      },
      {
        userImage: "openai.png",
        message: "Image Recognition Model Labeling has been done",
        time: "10:11:17",
      },
    ],
    activeTasks: [
      {
        title: "Image and Audio Labeling",
        location: "India",
        applications: 1,
      },
    ],
    // New data for submissions
    submissions: [
      {
        id: 1,
        title: "Image Recognition Model Labeling",
        curator: "John",
        date: "2024-01-20",
        status: "pending",
        description: "Comprehensive market analysis for Q1 2024",
        userImage: "https://randomuser.me/api/portraits",
      },
      {
        id: 2,
        title: "Image Recognition Model Labeling",
        curator: "Jane",
        date: "2024-01-19",
        status: "pending",
        description: "Detailed analysis of top 5 competitors",
        userImage: "https://randomuser.me/api/portraits",
      },
    ],
    approvedSubmissions: [
      {
        id: 3,
        title: "Audio Labeling",
        curator: "Alice",
        approvalDate: "2024-01-18",
        description: "Results from user interviews and surveys",
        userImage: "https://randomuser.me/api/portraits",
      },
      {
        id: 4,
        title: "Video Labeling",
        curator: "Bob",
        approvalDate: "2024-01-17",
        description: "Q1 2024 social media planning",
        userImage: "https://randomuser.me/api/portraits",
      },
    ],
    rejectedSubmissions: [
      {
        id: 5,
        title: "Image Recognition Model Labeling",
        curator: "Charlie",
        rejectionDate: "2024-01-16",
        description: "Blog post schedule for February",
        rejectionReason: "Needs more detail",
        userImage: "https://randomuser.me/api/portraits",
      },
      {
        id: 6,
        title: "Audio Labeling",
        curator: "Diana",
        rejectionDate: "2024-01-15",
        description: "Newsletter templates for Q1",
        rejectionReason: "Revise messaging",
        userImage: "https://randomuser.me/api/portraits",
      },
    ],
  });
});

app.get("/curator-dashboard", (req, res) => {
  return res.render("curator-dashboard", {
    curator: {
      name: "Aman",
      profilePicture: "mountains.jpeg",
      rank: "Expert Curator",
    },
    stats: {
      totalWorkDone: 154,
      workDone: 5,
      workAssigned: 12,
      totalEarnings: 15730,
      todayEarnings: 200,
    },
    assignedWork: [
      {
        id: 1,
        title: "Image Recognition Model Labeling",
        description: "Label Images for AI Model",
        dueDate: "2024-02-01",
        status: "In Progress",
        payment: 300,
      },
      {
        id: 2,
        title: "Image Recognition Model Labeling",
        description: "Label Images for AI Model",
        dueDate: "2024-02-01",
        status: "In Progress",
        payment: 330,
      },
      {
        id: 2,
        title: "Audio Labeling",
        description: "Label Images for AI Model",
        dueDate: "2024-02-01",
        status: "In Progress",
        payment: 500,
      },
      // More assigned work...
    ],
    completedWork: [
      {
        id: 2,
        title: "Image Recognition Model Labeling",
        description: "Label Images for AI Model",
        completionDate: "2024-01-15",
        payment: 250,
      },
      // More completed work...
    ],
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
