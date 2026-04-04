export const isClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: "Not authenticated" });
  }

  if (["client", "admin"].includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    msg: "Access denied. Only client or admin can create webinar",
  });
};


