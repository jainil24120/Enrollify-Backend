import Webinar from "../models/webinar.js";
import ClientProfile from "../models/clientProfile.js";
import Subscription from "../models/subscription.js";
import Registration from "../models/registration.js";
import { sendEmail } from "../utils/emailService.js";
import { generateSubdomain } from "../utils/generateSubdomain.js";
import { getIO } from "../utils/socket.js";

export const createWebinar = async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({
        msg: "Only clients can create webinars",
      });
    }

    const {
      title,
      subtitle,
      slug,
      description,
      categories,
      webinarDateTime,
      durationMinutes,
      price,
      originalPrice,
      registrationDeadline,
      clients,
      language,
      maxSeats,
      bannerImage,
      meetingLink,
      status,
      speakerName,
      speakerBio,
      speakerImage,
      speakerSocials,
      learningOutcomes,
      targetAudience,
      faqs,
      agenda,
      testimonials,
      ctaText,
      bonusText,
      trustLogos,
    } = req.body;

    let parsedBannerImage = bannerImage || "";
    if (req.file) {
      parsedBannerImage = `/upload/${req.file.filename}`;
    }

    // ✅ Basic Validation
    if (
      !title ||
      !description ||
      !webinarDateTime ||
      !durationMinutes ||
      !categories ||
      categories.length === 0
    ) {
      return res.status(400).json({
        msg: "Title, description, webinarDateTime, durationMinutes and categories are required",
      });
    }

    // if (!clients || !Array.isArray(clients) || clients.length === 0) {
    //   return res.status(400).json({
    //     msg: "At least one client profile is required",
    //   });
    // }

    // ✅ Date Validation
    const webinarDate = new Date(webinarDateTime);

    if (isNaN(webinarDate)) {
      return res.status(400).json({
        msg: "Invalid webinar date/time format",
      });
    }

    if (webinarDate < new Date()) {
      return res.status(400).json({
        msg: "Webinar date cannot be in the past",
      });
    }

    // ✅ Duration Validation
    if (durationMinutes < 15) {
      return res.status(400).json({
        msg: "Duration must be at least 15 minutes",
      });
    }

    // ✅ Price Validation
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        msg: "Price cannot be negative",
      });
    }

    // ✅ Seats Validation
    if (maxSeats !== undefined && maxSeats < 1) {
      return res.status(400).json({
        msg: "Max seats must be at least 1",
      });
    }

    // ✅ Get creator's client profile
    const clientProfile = await ClientProfile.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!clientProfile) {
      return res.status(403).json({
        msg: "Client profile not found",
      });
    }

    if (!clientProfile.subscription) {
      return res.status(403).json({
        msg: "Please buy a subscription plan",
      });
    }

    const subscription = await Subscription.findById(
      clientProfile.subscription
    );

    if (!subscription || subscription.status !== "active") {
      return res.status(403).json({
        msg: "Your subscription is not active",
      });
    }
    // ✅ Expiry Check
    if (!clientProfile.subscriptionValidTill ||
      clientProfile.subscriptionValidTill < new Date()) {
      return res.status(403).json({
        msg: "Subscription expired. Please renew.",
      });
    }// ✅ Plan Limit Check
    const createdThisMonth = await Webinar.countDocuments({
      createdBy: req.user.id,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    if (
      subscription.limits?.webinarsPerMonth &&
      createdThisMonth >= subscription.limits.webinarsPerMonth
    ) {
      return res.status(403).json({
        msg: "Monthly webinar limit reached for your plan",
      });
    }

    if (
      subscription.limits?.maxDurationMinutes &&
      durationMinutes > subscription.limits.maxDurationMinutes
    ) {
      return res.status(403).json({
        msg: "Duration exceeds your plan limit",
      });
    }

    const webinarStatus = status || "scheduled";


    if (price > 0 && !meetingLink && webinarStatus === "live") {
      return res.status(400).json({
        msg: "Meeting link required for paid live webinar",
      });
    }
    // Parse JSON strings if sent from form data
    const parseJSON = (val) => {
      if (!val) return undefined;
      if (typeof val === "string") try { return JSON.parse(val); } catch { return val; }
      return val;
    };

    // ✅ CREATE WEBINAR
    const webinar = await Webinar.create({
      title,
      subtitle,
      slug: slug || undefined, // auto-generated if not provided
      description,
      categories: parseJSON(categories),
      webinarDateTime: webinarDate,
      durationMinutes,
      price,
      originalPrice,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      clients: clients || clientProfile._id,
      language,
      maxSeats,
      bannerImage: parsedBannerImage,
      meetingLink,
      status: webinarStatus,
      createdBy: req.user.id,
      speakerName,
      speakerBio,
      speakerImage,
      speakerSocials: parseJSON(speakerSocials),
      learningOutcomes: parseJSON(learningOutcomes),
      targetAudience: parseJSON(targetAudience),
      faqs: parseJSON(faqs),
      agenda: parseJSON(agenda),
      testimonials: parseJSON(testimonials),
      ctaText,
      bonusText,
      trustLogos: parseJSON(trustLogos),
    });

    const webinarLink = `https://enrollify.xyz/w/${webinar.slug}`;

    //SEND EMAIL (Safe Wrapper)
    try {
      await sendEmail({
        to: req.user.email,
        subject: "✅ Webinar Created",
        html: `
          <h2>Webinar Created Successfully 🎉</h2>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Date:</strong> ${webinarDate.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}</p>
          <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
            <p>
        <strong>Webinar Page:</strong><br/>
        <a href="${webinarLink}">
          ${webinarLink}
        </a>
      </p>
          <br/>
          <p>– Team Enrollify</p>
        `,
      });
    } catch (emailErr) {
      console.error("Email failed but webinar created:", emailErr.message);
    }

    const populatedWebinar = await Webinar.findById(webinar._id)
      .populate("createdBy", "firstname lastname email")
      .populate("clients", "Organization_Name");

    // Notify admin of new webinar
    try {
      const io = getIO();
      io.to("admin").emit("new-webinar", {
        webinarId: webinar._id,
        title: webinar.title,
        createdBy: req.user.email,
        status: webinarStatus,
        timestamp: new Date(),
      });
    } catch (socketErr) {}

    res.status(201).json({
      msg: "Webinar created successfully",
      webinar: populatedWebinar,
      webinarUrl: `https://enrollify.xyz/w/${webinar.slug}`,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllWebinar = async (req, res) => {
  try {
    // 🔥 Step 1: Find client profile
    const clientProfile = await ClientProfile.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!clientProfile) {
      return res.status(404).json({ msg: "Client profile not found" });
    }

    // 🔥 Step 2: Use clientProfile._id
    const webinars = await Webinar.find({
      clients: clientProfile._id,
    })
      .sort({ webinarDateTime: -1 })
      .populate("createdBy", "firstname lastname email")
      .populate("clients", "Organization_Name");

    res.json(webinars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getWebinarById = async (req, res) => {
  try {
    const { id } = req.params;

    const webinar = await Webinar.findById(id)
      .populate("createdBy", "firstname lastname email role")
      .populate("clients", "Organization_Name");

    if (!webinar) {
      return res.status(404).json({ msg: "Webinar not found" });
    }

    res.json(webinar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const editWebinar = async (req, res) => {
  try {
    const { webinarId } = req.params;

    const webinar = await Webinar.findById(webinarId);

    if (!webinar) {
      return res.status(404).json({ msg: "Webinar not found" });
    }

    // ✅ Only owner can edit
    if (webinar.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    // ✅ Whitelist updates
    const allowedUpdates = [
      "title",
      "subtitle",
      "slug",
      "description",
      "categories",
      "webinarDateTime",
      "durationMinutes",
      "price",
      "originalPrice",
      "registrationDeadline",
      "language",
      "maxSeats",
      "bannerImage",
      "meetingLink",
      "status",
      "speakerName",
      "speakerBio",
      "speakerImage",
      "speakerSocials",
      "learningOutcomes",
      "targetAudience",
      "faqs",
      "agenda",
      "testimonials",
      "ctaText",
      "bonusText",
      "trustLogos",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (req.file) {
      updates.bannerImage = `/upload/${req.file.filename}`;
    }

    // ✅ Date validation (if updating date)
    if (updates.webinarDateTime) {
      const updatedDate = new Date(updates.webinarDateTime);

      if (isNaN(updatedDate)) {
        return res.status(400).json({
          msg: "Invalid webinar date/time format",
        });
      }

      if (updatedDate < new Date()) {
        return res.status(400).json({
          msg: "Webinar date cannot be in the past",
        });
      }

      updates.webinarDateTime = updatedDate;
    }

    const updatedWebinar = await Webinar.findByIdAndUpdate(
      webinarId,
      updates,
      { new: true, runValidators: true }
    )
      .populate("createdBy", "firstname lastname email")
      .populate("clients", "Organization_Name");

    // Broadcast webinar update to anyone in the webinar room
    try {
      const io = getIO();
      io.to(`webinar_${webinarId}`).emit("webinar-updated", {
        webinarId,
        title: updatedWebinar.title,
        status: updatedWebinar.status,
        timestamp: new Date(),
      });

      // If webinar went live, notify all registered attendees
      if (updates.status === "live") {
        const registrations = await Registration.find({ webinar: webinarId });
        for (const reg of registrations) {
          if (reg.user) {
            io.to(`user_${reg.user}`).emit("webinar-live", {
              webinarId,
              title: updatedWebinar.title,
              meetingLink: updatedWebinar.meetingLink,
            });
          }
        }
      }
    } catch (socketErr) {}

    res.json({
      msg: "Webinar updated successfully",
      webinar: updatedWebinar,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rescheduleWebinar = async (req, res) => {
  try {
    const { webinarId } = req.params;
    const { webinarDateTime, durationMinutes } = req.body;

    const webinar = await Webinar.findById(webinarId);

    if (!webinar) {
      return res.status(404).json({ msg: "Webinar not found" });
    }

    // Only owner
    if (webinar.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    if (webinar.status === "completed") {
      return res.status(400).json({
        msg: "Completed webinar cannot be rescheduled",
      });
    }

    const newDate = new Date(webinarDateTime);

    if (isNaN(newDate) || newDate < new Date()) {
      return res.status(400).json({
        msg: "Invalid new date",
      });
    }

    if (durationMinutes && durationMinutes < 15) {
      return res.status(400).json({
        msg: "Duration must be at least 15 minutes",
      });
    }

    // ✅ Store old date BEFORE updating
    const oldDate = webinar.webinarDateTime;

    webinar.webinarDateTime = newDate;

    if (durationMinutes) {
      webinar.durationMinutes = durationMinutes;
    }

    await webinar.save();

    // ✅ Correct variable name
    const registrations = await Registration.find({
      webinar: webinarId,
    }).populate("user", "email");

    // ✅ Send emails safely (Sequential to avoid server hang on large attendees)
    for (const reg of registrations) {
      const recipientEmail = reg.email || reg.user?.email;
      if (recipientEmail) {
        try {
          await sendEmail({
            to: recipientEmail,
            subject: "📢 Webinar Rescheduled",
            html: `
              <h2>Webinar Date Updated</h2>
              <p>Your webinar "${webinar.title}" has been rescheduled.</p>
              <p><strong>Old Date:</strong> ${oldDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
              <p><strong>New Date:</strong> ${newDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
            `,
          });
        } catch (e) {
          console.error(`Email failed for ${recipientEmail}:`, e.message);
        }
      }
    }

    // Broadcast reschedule to webinar room
    try {
      const io = getIO();
      io.to(`webinar_${webinarId}`).emit("webinar-rescheduled", {
        webinarId,
        title: webinar.title,
        oldDate: oldDate,
        newDate: newDate,
      });
    } catch (socketErr) {}

    res.json({
      msg: "Webinar rescheduled successfully",
      webinar,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};