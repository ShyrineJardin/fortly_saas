router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔑 email:', email, '| pw length:', password?.length);

    const [admins] = await db.sequelize.query(
      `SELECT * FROM "Admins" WHERE email = '${email}'`
    );
    const admin = admins[0];

    if (!admin) {
      console.log('❌ Not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Found admin, hash length:', admin.password?.length);
    console.log('🔐 Hash:', admin.password?.substring(0, 30));

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('🔐 Match:', isMatch);

    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    if (!admin.isActive) return res.status(401).json({ message: 'Account disabled' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});