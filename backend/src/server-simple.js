/**
 * Simplified server for demo without MongoDB
 */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  connectDatabase,
  checkDatabaseHealth,
  getMockData,
  generateId,
} = require("./config/mockDatabase");
const logger = require("./config/logger");

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Initialize server
 */
async function startServer() {
  try {
    // Connect to mock database
    await connectDatabase();

    // Security middleware
    app.use(helmet());
    app.use(
      cors({
        origin: [
          process.env.CORS_ORIGIN || "http://localhost:3000",
          "http://localhost:3002",
        ],
        credentials: true,
      })
    );

    // General middleware
    app.use(compression());
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging middleware
    app.use(
      morgan("combined", {
        stream: { write: (message) => logger.info(message.trim()) },
      })
    );

    // Get mock data
    const mockData = getMockData();

    // Health check
    app.get("/health", async (req, res) => {
      const isHealthy = await checkDatabaseHealth();
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? "OK" : "ERROR",
        timestamp: new Date().toISOString(),
        services: {
          database: { status: isHealthy ? "OK" : "ERROR", type: "Mock" },
          cache: { status: "OK", type: "In-Memory" },
        },
      });
    });

    // Auth routes
    app.post("/api/auth/login", async (req, res) => {
      try {
        const { email, password } = req.body;

        logger.info("Login attempt", { email });

        const user = mockData.users.find(
          (u) => u.email === email && u.isActive
        );
        if (!user) {
          logger.warn("User not found", { email });
          return res.status(401).json({ message: "Invalid credentials" });
        }

        logger.info("User found, checking password", {
          email,
          hasPassword: !!password,
        });

        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );
        if (!isPasswordValid) {
          logger.warn("Invalid password", { email });
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
          { userId: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET || "demo-secret",
          { expiresIn: "24h" }
        );

        logger.info("Login successful", { email, role: user.role });

        res.json({
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            lastLoginAt: new Date(),
          },
        });
      } catch (error) {
        logger.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/api/auth/logout", (req, res) => {
      res.json({ message: "Logged out successfully" });
    });

    app.get("/api/auth/me", (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ message: "Access token required" });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "demo-secret"
        );

        const user = mockData.users.find((u) => u._id === decoded.userId);
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        res.json({
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
        });
      } catch (error) {
        res.status(401).json({ message: "Invalid token" });
      }
    });

    // Programs routes
    app.get("/api/admin/programs", (req, res) => {
      try {
        const { status, language, topic } = req.query;

        let programs = [...mockData.programs];

        // Apply filters
        if (status) {
          programs = programs.filter((p) => p.status === status);
        }
        if (language) {
          programs = programs.filter((p) => p.languagePrimary === language);
        }
        if (topic) {
          const topicObj = mockData.topics.find((t) => t.name === topic);
          if (topicObj) {
            programs = programs.filter((p) =>
              p.topicIds.includes(topicObj._id)
            );
          }
        }

        // Add assets and topics to programs
        const programsWithDetails = programs.map((program) => {
          const assets = mockData.programAssets.filter(
            (a) => a.programId === program._id
          );
          const topics = mockData.topics.filter((t) =>
            program.topicIds.includes(t._id)
          );

          return {
            ...program,
            topics: topics.map((t) => t.name),
            assets: {
              posters: assets.reduce((acc, asset) => {
                if (!acc[asset.language]) acc[asset.language] = {};
                acc[asset.language][asset.variant] = asset.url;
                return acc;
              }, {}),
            },
          };
        });

        res.json({
          programs: programsWithDetails,
          pagination: { cursor: null, hasMore: false },
        });
      } catch (error) {
        logger.error("Get programs error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Get single program
    app.get('/api/admin/programs/:id', (req, res) => {
      try {
        const program = mockData.programs.find(p => p._id === req.params.id);
        
        if (!program) {
          return res.status(404).json({ message: 'Program not found' });
        }

        // Get assets and topics
        const assets = mockData.programAssets.filter(a => a.programId === program._id);
        const topics = mockData.topics.filter(t => program.topicIds.includes(t._id));
        
        const programWithDetails = {
          ...program,
          topics: topics.map(t => t.name),
          assets: {
            posters: assets.reduce((acc, asset) => {
              if (!acc[asset.language]) acc[asset.language] = {};
              acc[asset.language][asset.variant] = asset.url;
              return acc;
            }, {})
          }
        };

        res.json(programWithDetails);

      } catch (error) {
        logger.error('Get program error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    // Update program
    app.put('/api/admin/programs/:id', (req, res) => {
      try {
        const programIndex = mockData.programs.findIndex(p => p._id === req.params.id);
        
        if (programIndex === -1) {
          return res.status(404).json({ message: 'Program not found' });
        }

        const { title, description, languagePrimary, languagesAvailable, topicIds, status } = req.body;

        // Update program
        const program = mockData.programs[programIndex];
        if (title !== undefined) program.title = title;
        if (description !== undefined) program.description = description;
        if (languagePrimary !== undefined) program.languagePrimary = languagePrimary;
        if (languagesAvailable !== undefined) program.languagesAvailable = languagesAvailable;
        if (topicIds !== undefined) program.topicIds = topicIds;
        if (status !== undefined) program.status = status;
        program.updatedAt = new Date();

        logger.info('Program updated', {
          programId: program._id,
          title: program.title
        });

        // Return updated program with details
        const assets = mockData.programAssets.filter(a => a.programId === program._id);
        const topics = mockData.topics.filter(t => program.topicIds.includes(t._id));
        
        const programWithDetails = {
          ...program,
          topics: topics.map(t => t.name),
          assets: {
            posters: assets.reduce((acc, asset) => {
              if (!acc[asset.language]) acc[asset.language] = {};
              acc[asset.language][asset.variant] = asset.url;
              return acc;
            }, {})
          }
        };

        res.json(programWithDetails);

      } catch (error) {
        logger.error('Update program error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    // Delete program
    app.delete('/api/admin/programs/:id', (req, res) => {
      try {
        const programIndex = mockData.programs.findIndex(p => p._id === req.params.id);
        
        if (programIndex === -1) {
          return res.status(404).json({ message: 'Program not found' });
        }

        const program = mockData.programs[programIndex];
        
        // Remove program
        mockData.programs.splice(programIndex, 1);
        
        // Remove associated assets
        mockData.programAssets = mockData.programAssets.filter(a => a.programId !== req.params.id);

        logger.info('Program deleted', {
          programId: program._id,
          title: program.title
        });

        res.status(204).send();

      } catch (error) {
        logger.error('Delete program error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
    app.post("/api/admin/programs", (req, res) => {
      try {
        const {
          title,
          description,
          languagePrimary,
          languagesAvailable,
          topicIds,
        } = req.body;

        if (!title || !languagePrimary || !languagesAvailable) {
          return res.status(400).json({
            message:
              "Title, primary language, and available languages are required",
          });
        }

        const newProgram = {
          _id: generateId(),
          title,
          description: description || "",
          languagePrimary,
          languagesAvailable,
          status: "draft",
          topicIds: topicIds || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add to mock data
        mockData.programs.push(newProgram);

        // Add default assets
        const defaultAssets = [
          {
            _id: generateId(),
            programId: newProgram._id,
            language: languagePrimary,
            variant: "portrait",
            assetType: "poster",
            url: `https://via.placeholder.com/300x400/0ea5e9/ffffff?text=${encodeURIComponent(
              title
            )}`,
            createdAt: new Date(),
          },
          {
            _id: generateId(),
            programId: newProgram._id,
            language: languagePrimary,
            variant: "landscape",
            assetType: "poster",
            url: `https://via.placeholder.com/400x300/0ea5e9/ffffff?text=${encodeURIComponent(
              title
            )}`,
            createdAt: new Date(),
          },
        ];

        mockData.programAssets.push(...defaultAssets);

        logger.info("Program created", {
          programId: newProgram._id,
          title: newProgram.title,
        });

        // Return program with details
        const topics = mockData.topics.filter((t) =>
          newProgram.topicIds.includes(t._id)
        );
        const programWithDetails = {
          ...newProgram,
          topics: topics.map((t) => t.name),
          assets: {
            posters: defaultAssets.reduce((acc, asset) => {
              if (!acc[asset.language]) acc[asset.language] = {};
              acc[asset.language][asset.variant] = asset.url;
              return acc;
            }, {}),
          },
        };

        res.status(201).json(programWithDetails);
      } catch (error) {
        logger.error("Create program error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Enhanced Catalog routes (Public API)
    app.get("/catalog/programs", (req, res) => {
      try {
        const { language, topic, limit = 20, cursor } = req.query;

        // Only published programs
        let programs = mockData.programs.filter(
          (p) => p.status === "published"
        );

        // Apply filters
        if (language) {
          programs = programs.filter((p) => 
            p.languagePrimary === language || 
            p.languagesAvailable.includes(language)
          );
        }
        if (topic) {
          const topicObj = mockData.topics.find((t) => t.name === topic);
          if (topicObj) {
            programs = programs.filter((p) =>
              p.topicIds.includes(topicObj._id)
            );
          }
        }

        // Pagination
        const startIndex = cursor ? parseInt(cursor) : 0;
        const endIndex = startIndex + parseInt(limit);
        const paginatedPrograms = programs.slice(startIndex, endIndex);
        const hasMore = endIndex < programs.length;

        // Add details
        const programsWithDetails = paginatedPrograms.map((program) => {
          const assets = mockData.programAssets.filter(
            (a) => a.programId === program._id
          );
          const topics = mockData.topics.filter((t) =>
            program.topicIds.includes(t._id)
          );

          // Get lesson count
          const lessonCount = mockData.lessons.filter(
            l => l.programId === program._id && l.status === 'published'
          ).length;

          return {
            id: program._id,
            title: program.title,
            description: program.description,
            language_primary: program.languagePrimary,
            languages_available: program.languagesAvailable,
            published_at: program.publishedAt,
            lesson_count: lessonCount,
            topics: topics.map((t) => ({
              id: t._id,
              name: t.name,
              slug: t.name.toLowerCase().replace(/\s+/g, '-')
            })),
            assets: {
              posters: assets.reduce((acc, asset) => {
                if (!acc[asset.language]) acc[asset.language] = {};
                acc[asset.language][asset.variant] = asset.url;
                return acc;
              }, {}),
            },
          };
        });

        res.set("Cache-Control", "public, max-age=300");
        res.json({
          programs: programsWithDetails,
          pagination: { 
            cursor: hasMore ? endIndex.toString() : null, 
            hasMore,
            total: programs.length
          },
        });
      } catch (error) {
        logger.error("Get catalog programs error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/catalog/programs/:id", (req, res) => {
      try {
        const program = mockData.programs.find(
          p => p._id === req.params.id && p.status === 'published'
        );
        
        if (!program) {
          return res.status(404).json({ message: 'Program not found' });
        }

        // Get program details
        const assets = mockData.programAssets.filter(a => a.programId === program._id);
        const topics = mockData.topics.filter(t => program.topicIds.includes(t._id));
        const lessons = mockData.lessons
          .filter(l => l.programId === program._id && l.status === 'published')
          .sort((a, b) => a.order - b.order);

        // Get lesson assets
        const lessonsWithAssets = lessons.map(lesson => {
          const lessonAssets = mockData.lessonAssets.filter(a => a.lessonId === lesson._id);
          return {
            id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            order: lesson.order,
            language_primary: lesson.languagePrimary,
            languages_available: lesson.languagesAvailable,
            published_at: lesson.publishedAt,
            assets: {
              thumbnails: lessonAssets.reduce((acc, asset) => {
                if (!acc[asset.language]) acc[asset.language] = {};
                acc[asset.language][asset.variant] = asset.url;
                return acc;
              }, {})
            }
          };
        });

        const programWithDetails = {
          id: program._id,
          title: program.title,
          description: program.description,
          language_primary: program.languagePrimary,
          languages_available: program.languagesAvailable,
          published_at: program.publishedAt,
          lesson_count: lessonsWithAssets.length,
          total_duration: lessonsWithAssets.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
          topics: topics.map(t => ({
            id: t._id,
            name: t.name,
            slug: t.name.toLowerCase().replace(/\s+/g, '-')
          })),
          assets: {
            posters: assets.reduce((acc, asset) => {
              if (!acc[asset.language]) acc[asset.language] = {};
              acc[asset.language][asset.variant] = asset.url;
              return acc;
            }, {})
          },
          lessons: lessonsWithAssets
        };

        res.set("Cache-Control", "public, max-age=300");
        res.json(programWithDetails);

      } catch (error) {
        logger.error('Get catalog program error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get("/catalog/lessons", (req, res) => {
      try {
        const { language, topic, program_id, limit = 20, cursor } = req.query;

        // Only published lessons
        let lessons = mockData.lessons.filter(l => l.status === 'published');

        // Apply filters
        if (language) {
          lessons = lessons.filter(l => 
            l.languagePrimary === language || 
            l.languagesAvailable.includes(language)
          );
        }
        
        if (program_id) {
          lessons = lessons.filter(l => l.programId === program_id);
        }
        
        if (topic) {
          const topicObj = mockData.topics.find(t => t.name === topic);
          if (topicObj) {
            // Filter by programs that have this topic
            const programsWithTopic = mockData.programs.filter(p => 
              p.topicIds.includes(topicObj._id)
            );
            const programIds = programsWithTopic.map(p => p._id);
            lessons = lessons.filter(l => programIds.includes(l.programId));
          }
        }

        // Pagination
        const startIndex = cursor ? parseInt(cursor) : 0;
        const endIndex = startIndex + parseInt(limit);
        const paginatedLessons = lessons.slice(startIndex, endIndex);
        const hasMore = endIndex < lessons.length;

        // Add details
        const lessonsWithDetails = paginatedLessons.map(lesson => {
          const assets = mockData.lessonAssets.filter(a => a.lessonId === lesson._id);
          const program = mockData.programs.find(p => p._id === lesson.programId);
          
          return {
            id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            order: lesson.order,
            language_primary: lesson.languagePrimary,
            languages_available: lesson.languagesAvailable,
            published_at: lesson.publishedAt,
            program: program ? {
              id: program._id,
              title: program.title
            } : null,
            assets: {
              thumbnails: assets.reduce((acc, asset) => {
                if (!acc[asset.language]) acc[asset.language] = {};
                acc[asset.language][asset.variant] = asset.url;
                return acc;
              }, {})
            }
          };
        });

        res.set("Cache-Control", "public, max-age=300");
        res.json({
          lessons: lessonsWithDetails,
          pagination: {
            cursor: hasMore ? endIndex.toString() : null,
            hasMore,
            total: lessons.length
          }
        });

      } catch (error) {
        logger.error('Get catalog lessons error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get("/catalog/lessons/:id", (req, res) => {
      try {
        const lesson = mockData.lessons.find(
          l => l._id === req.params.id && l.status === 'published'
        );
        
        if (!lesson) {
          return res.status(404).json({ message: 'Lesson not found' });
        }

        // Get lesson details
        const assets = mockData.lessonAssets.filter(a => a.lessonId === lesson._id);
        const program = mockData.programs.find(p => p._id === lesson.programId);
        
        // Get related lessons from the same program
        const relatedLessons = mockData.lessons
          .filter(l => l.programId === lesson.programId && l._id !== lesson._id && l.status === 'published')
          .sort((a, b) => a.order - b.order)
          .slice(0, 5)
          .map(l => ({
            id: l._id,
            title: l.title,
            duration: l.duration,
            order: l.order
          }));

        const lessonWithDetails = {
          id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          order: lesson.order,
          language_primary: lesson.languagePrimary,
          languages_available: lesson.languagesAvailable,
          published_at: lesson.publishedAt,
          program: program ? {
            id: program._id,
            title: program.title,
            description: program.description
          } : null,
          related_lessons: relatedLessons,
          assets: {
            thumbnails: assets.reduce((acc, asset) => {
              if (!acc[asset.language]) acc[asset.language] = {};
              acc[asset.language][asset.variant] = asset.url;
              return acc;
            }, {})
          }
        };

        res.set("Cache-Control", "public, max-age=300");
        res.json(lessonWithDetails);

      } catch (error) {
        logger.error('Get catalog lesson error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get("/catalog/topics", (req, res) => {
      try {
        // Get topics with published content counts
        const topicsWithCounts = mockData.topics.map(topic => {
          const programCount = mockData.programs.filter(p => 
            p.topicIds.includes(topic._id) && p.status === 'published'
          ).length;
          
          const lessonCount = mockData.lessons.filter(l => {
            const program = mockData.programs.find(p => p._id === l.programId);
            return program && program.topicIds.includes(topic._id) && l.status === 'published';
          }).length;

          return {
            id: topic._id,
            name: topic.name,
            slug: topic.name.toLowerCase().replace(/\s+/g, '-'),
            description: topic.description || '',
            program_count: programCount,
            lesson_count: lessonCount,
            total_content: programCount + lessonCount
          };
        }).filter(topic => topic.total_content > 0); // Only topics with published content

        res.set("Cache-Control", "public, max-age=600");
        res.json({
          topics: topicsWithCounts
        });

      } catch (error) {
        logger.error('Get catalog topics error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get("/catalog/search", (req, res) => {
      try {
        const { q, type, language, limit = 20 } = req.query;
        
        if (!q || q.trim().length < 2) {
          return res.status(400).json({ message: 'Search query must be at least 2 characters' });
        }

        const searchTerm = q.toLowerCase().trim();
        const results = [];

        // Search programs
        if (!type || type === 'program') {
          const matchingPrograms = mockData.programs
            .filter(p => p.status === 'published')
            .filter(p => {
              const matchesQuery = p.title.toLowerCase().includes(searchTerm) || 
                                 p.description.toLowerCase().includes(searchTerm);
              const matchesLanguage = !language || 
                                    p.languagePrimary === language || 
                                    p.languagesAvailable.includes(language);
              return matchesQuery && matchesLanguage;
            })
            .map(p => {
              const assets = mockData.programAssets.filter(a => a.programId === p._id);
              const topics = mockData.topics.filter(t => p.topicIds.includes(t._id));
              
              return {
                type: 'program',
                id: p._id,
                title: p.title,
                description: p.description,
                language_primary: p.languagePrimary,
                published_at: p.publishedAt,
                topics: topics.map(t => t.name),
                assets: {
                  posters: assets.reduce((acc, asset) => {
                    if (!acc[asset.language]) acc[asset.language] = {};
                    acc[asset.language][asset.variant] = asset.url;
                    return acc;
                  }, {})
                }
              };
            });
          
          results.push(...matchingPrograms);
        }

        // Search lessons
        if (!type || type === 'lesson') {
          const matchingLessons = mockData.lessons
            .filter(l => l.status === 'published')
            .filter(l => {
              const matchesQuery = l.title.toLowerCase().includes(searchTerm) || 
                                 l.description.toLowerCase().includes(searchTerm);
              const matchesLanguage = !language || 
                                    l.languagePrimary === language || 
                                    l.languagesAvailable.includes(language);
              return matchesQuery && matchesLanguage;
            })
            .map(l => {
              const assets = mockData.lessonAssets.filter(a => a.lessonId === l._id);
              const program = mockData.programs.find(p => p._id === l.programId);
              
              return {
                type: 'lesson',
                id: l._id,
                title: l.title,
                description: l.description,
                duration: l.duration,
                language_primary: l.languagePrimary,
                published_at: l.publishedAt,
                program: program ? {
                  id: program._id,
                  title: program.title
                } : null,
                assets: {
                  thumbnails: assets.reduce((acc, asset) => {
                    if (!acc[asset.language]) acc[asset.language] = {};
                    acc[asset.language][asset.variant] = asset.url;
                    return acc;
                  }, {})
                }
              };
            });
          
          results.push(...matchingLessons);
        }

        // Sort by relevance (simple title match scoring)
        results.sort((a, b) => {
          const aScore = a.title.toLowerCase().indexOf(searchTerm) === 0 ? 2 : 
                        a.title.toLowerCase().includes(searchTerm) ? 1 : 0;
          const bScore = b.title.toLowerCase().indexOf(searchTerm) === 0 ? 2 : 
                        b.title.toLowerCase().includes(searchTerm) ? 1 : 0;
          return bScore - aScore;
        });

        // Apply limit
        const limitedResults = results.slice(0, parseInt(limit));

        res.set("Cache-Control", "public, max-age=300");
        res.json({
          query: q,
          results: limitedResults,
          total: results.length,
          has_more: results.length > parseInt(limit)
        });

      } catch (error) {
        logger.error('Catalog search error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    // User management endpoints
    app.get('/api/admin/users', (req, res) => {
      try {
        const { role, status } = req.query;
        
        let users = [...mockData.users];
        
        // Apply filters
        if (role) {
          users = users.filter(u => u.role === role);
        }
        if (status === 'active') {
          users = users.filter(u => u.isActive);
        } else if (status === 'inactive') {
          users = users.filter(u => !u.isActive);
        }
        
        // Remove sensitive data
        const safeUsers = users.map(user => ({
          _id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }));
        
        res.json({ users: safeUsers });
        
      } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.post('/api/admin/users', async (req, res) => {
      try {
        const { email, password, role } = req.body;
        
        if (!email || !password || !role) {
          return res.status(400).json({ message: 'Email, password, and role are required' });
        }
        
        // Check if user already exists
        const existingUser = mockData.users.find(u => u.email === email);
        if (existingUser) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        const newUser = {
          _id: generateId(),
          email,
          passwordHash,
          role,
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date()
        };
        
        mockData.users.push(newUser);
        
        logger.info('User created', {
          userId: newUser._id,
          email: newUser.email,
          role: newUser.role
        });
        
        // Return safe user data
        res.status(201).json({
          _id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
          lastLoginAt: newUser.lastLoginAt,
          createdAt: newUser.createdAt
        });
        
      } catch (error) {
        logger.error('Create user error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.put('/api/admin/users/:id', (req, res) => {
      try {
        const userIndex = mockData.users.findIndex(u => u._id === req.params.id);
        
        if (userIndex === -1) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const { email, role, isActive } = req.body;
        const user = mockData.users[userIndex];
        
        // Update user fields
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        user.updatedAt = new Date();
        
        logger.info('User updated', {
          userId: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        });
        
        // Return safe user data
        res.json({
          _id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
        
      } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.delete('/api/admin/users/:id', (req, res) => {
      try {
        const userIndex = mockData.users.findIndex(u => u._id === req.params.id);
        
        if (userIndex === -1) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const user = mockData.users[userIndex];
        
        // Remove user
        mockData.users.splice(userIndex, 1);
        
        logger.info('User deleted', {
          userId: user._id,
          email: user.email
        });
        
        res.status(204).send();
        
      } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    // Asset upload endpoints
    app.post('/api/admin/programs/:id/assets', (req, res) => {
      try {
        const { id: programId } = req.params;
        const { language, variant, url } = req.body;

        if (!language || !variant || !url) {
          return res.status(400).json({ message: 'Language, variant, and URL are required' });
        }

        // Check if asset already exists
        const existingAssetIndex = mockData.programAssets.findIndex(
          a => a.programId === programId && a.language === language && a.variant === variant
        );

        let asset;
        if (existingAssetIndex !== -1) {
          // Update existing asset
          mockData.programAssets[existingAssetIndex].url = url;
          mockData.programAssets[existingAssetIndex].updatedAt = new Date();
          asset = mockData.programAssets[existingAssetIndex];
        } else {
          // Create new asset
          asset = {
            _id: generateId(),
            programId,
            language,
            variant,
            assetType: 'poster',
            url,
            filename: `${programId}-${language}-${variant}.jpg`,
            mimeType: 'image/jpeg',
            fileSize: 150000,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockData.programAssets.push(asset);
        }

        logger.info('Program asset uploaded', {
          assetId: asset._id,
          programId,
          language,
          variant
        });

        res.status(201).json(asset);

      } catch (error) {
        logger.error('Upload program asset error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.post('/api/admin/lessons/:id/assets', (req, res) => {
      try {
        const { id: lessonId } = req.params;
        const { language, variant, url } = req.body;

        if (!language || !variant || !url) {
          return res.status(400).json({ message: 'Language, variant, and URL are required' });
        }

        // Check if asset already exists
        const existingAssetIndex = mockData.lessonAssets.findIndex(
          a => a.lessonId === lessonId && a.language === language && a.variant === variant
        );

        let asset;
        if (existingAssetIndex !== -1) {
          // Update existing asset
          mockData.lessonAssets[existingAssetIndex].url = url;
          mockData.lessonAssets[existingAssetIndex].updatedAt = new Date();
          asset = mockData.lessonAssets[existingAssetIndex];
        } else {
          // Create new asset
          asset = {
            _id: generateId(),
            lessonId,
            language,
            variant,
            assetType: 'thumbnail',
            url,
            filename: `${lessonId}-${language}-${variant}.jpg`,
            mimeType: 'image/jpeg',
            fileSize: 75000,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockData.lessonAssets.push(asset);
        }

        logger.info('Lesson asset uploaded', {
          assetId: asset._id,
          lessonId,
          language,
          variant
        });

        res.status(201).json(asset);

      } catch (error) {
        logger.error('Upload lesson asset error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
    // Publishing endpoints
    app.post('/api/admin/programs/:id/publish', (req, res) => {
      try {
        const { publishType, languages, scheduledDateTime } = req.body;
        const programIndex = mockData.programs.findIndex(p => p._id === req.params.id);
        
        if (programIndex === -1) {
          return res.status(404).json({ message: 'Program not found' });
        }
        
        const program = mockData.programs[programIndex];
        
        if (publishType === 'now') {
          program.status = 'published';
          program.publishedAt = new Date();
          program.publishedLanguages = languages;
        } else if (publishType === 'scheduled') {
          program.status = 'scheduled';
          program.scheduledPublishAt = new Date(scheduledDateTime);
          program.publishedLanguages = languages;
        }
        
        program.updatedAt = new Date();
        
        logger.info('Program publishing updated', {
          programId: program._id,
          publishType,
          languages,
          scheduledDateTime
        });
        
        res.json(program);
        
      } catch (error) {
        logger.error('Program publish error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.post('/api/admin/lessons/:id/publish', (req, res) => {
      try {
        const { publishType, languages, scheduledDateTime } = req.body;
        const lessonIndex = mockData.lessons.findIndex(l => l._id === req.params.id);
        
        if (lessonIndex === -1) {
          return res.status(404).json({ message: 'Lesson not found' });
        }
        
        const lesson = mockData.lessons[lessonIndex];
        
        if (publishType === 'now') {
          lesson.status = 'published';
          lesson.publishedAt = new Date();
          lesson.publishedLanguages = languages;
        } else if (publishType === 'scheduled') {
          lesson.status = 'scheduled';
          lesson.scheduledPublishAt = new Date(scheduledDateTime);
          lesson.publishedLanguages = languages;
        }
        
        lesson.updatedAt = new Date();
        
        logger.info('Lesson publishing updated', {
          lessonId: lesson._id,
          publishType,
          languages,
          scheduledDateTime
        });
        
        res.json(lesson);
        
      } catch (error) {
        logger.error('Lesson publish error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get('/api/admin/publishing/scheduled', (req, res) => {
      try {
        const scheduledPrograms = mockData.programs
          .filter(p => p.status === 'scheduled')
          .map(p => ({
            ...p,
            type: 'program'
          }));
          
        const scheduledLessons = mockData.lessons
          .filter(l => l.status === 'scheduled')
          .map(l => ({
            ...l,
            type: 'lesson'
          }));
          
        const scheduledItems = [...scheduledPrograms, ...scheduledLessons]
          .sort((a, b) => new Date(a.scheduledPublishAt) - new Date(b.scheduledPublishAt));
          
        res.json({ items: scheduledItems });
        
      } catch (error) {
        logger.error('Get scheduled items error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get('/api/admin/publishing/published', (req, res) => {
      try {
        const publishedPrograms = mockData.programs
          .filter(p => p.status === 'published')
          .map(p => ({
            ...p,
            type: 'program',
            views: Math.floor(Math.random() * 2000) + 100 // Mock view count
          }));
          
        const publishedLessons = mockData.lessons
          .filter(l => l.status === 'published')
          .map(l => ({
            ...l,
            type: 'lesson',
            views: Math.floor(Math.random() * 1000) + 50 // Mock view count
          }));
          
        const publishedItems = [...publishedPrograms, ...publishedLessons]
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
          
        res.json({ items: publishedItems });
        
      } catch (error) {
        logger.error('Get published items error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get('/api/admin/publishing/drafts', (req, res) => {
      try {
        const draftPrograms = mockData.programs
          .filter(p => p.status === 'draft')
          .map(p => ({
            ...p,
            type: 'program',
            completionPercentage: Math.floor(Math.random() * 100) + 1 // Mock completion
          }));
          
        const draftLessons = mockData.lessons
          .filter(l => l.status === 'draft')
          .map(l => ({
            ...l,
            type: 'lesson',
            completionPercentage: Math.floor(Math.random() * 100) + 1 // Mock completion
          }));
          
        const draftItems = [...draftPrograms, ...draftLessons]
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          
        res.json({ items: draftItems });
        
      } catch (error) {
        logger.error('Get draft items error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get("/api/admin/topics", (req, res) => {
      res.json({ topics: mockData.topics });
    });

    // Error handling
    app.use((err, req, res, next) => {
      logger.error("Request error:", err);
      res.status(500).json({ message: "Internal server error" });
    });

    // Start server
    app.listen(PORT, () => {
      logger.info(`Demo server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || "development",
        port: PORT,
        note: "Using in-memory mock database",
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
