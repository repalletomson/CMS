/**
 * Admin routes for content management
 */
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

// Import controllers
const programController = require('../controllers/programController');
const termController = require('../controllers/termController');
const lessonController = require('../controllers/lessonController');
const topicController = require('../controllers/topicController');
const userController = require('../controllers/userController');
const assetController = require('../controllers/assetController');

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticate);

// Program routes
router.get('/programs', authorize(['admin', 'editor', 'viewer']), programController.getPrograms);
router.post('/programs', authorize(['admin', 'editor']), programController.createProgram);
router.get('/programs/:id', authorize(['admin', 'editor', 'viewer']), programController.getProgram);
router.put('/programs/:id', authorize(['admin', 'editor']), programController.updateProgram);
router.delete('/programs/:id', authorize(['admin', 'editor']), programController.deleteProgram);

// Term routes
router.get('/programs/:programId/terms', authorize(['admin', 'editor', 'viewer']), termController.getTerms);
router.post('/programs/:programId/terms', authorize(['admin', 'editor']), termController.createTerm);
router.get('/terms/:id', authorize(['admin', 'editor', 'viewer']), termController.getTerm);
router.put('/terms/:id', authorize(['admin', 'editor']), termController.updateTerm);
router.delete('/terms/:id', authorize(['admin', 'editor']), termController.deleteTerm);

// Lesson routes
router.get('/terms/:termId/lessons', authorize(['admin', 'editor', 'viewer']), lessonController.getLessons);
router.post('/terms/:termId/lessons', authorize(['admin', 'editor']), lessonController.createLesson);
router.get('/lessons/:id', authorize(['admin', 'editor', 'viewer']), lessonController.getLesson);
router.put('/lessons/:id', authorize(['admin', 'editor']), lessonController.updateLesson);
router.delete('/lessons/:id', authorize(['admin', 'editor']), lessonController.deleteLesson);

// Lesson publishing routes
router.post('/lessons/:id/publish', authorize(['admin', 'editor']), lessonController.publishLesson);
router.post('/lessons/:id/schedule', authorize(['admin', 'editor']), lessonController.scheduleLesson);
router.post('/lessons/:id/archive', authorize(['admin', 'editor']), lessonController.archiveLesson);

// Asset routes
router.post('/programs/:id/assets', authorize(['admin', 'editor']), assetController.uploadProgramAsset);
router.delete('/programs/:id/assets/:assetId', authorize(['admin', 'editor']), assetController.deleteProgramAsset);
router.post('/lessons/:id/assets', authorize(['admin', 'editor']), assetController.uploadLessonAsset);
router.delete('/lessons/:id/assets/:assetId', authorize(['admin', 'editor']), assetController.deleteLessonAsset);

// Topic routes
router.get('/topics', authorize(['admin', 'editor', 'viewer']), topicController.getTopics);
router.post('/topics', authorize(['admin', 'editor']), topicController.createTopic);
router.get('/topics/:id', authorize(['admin', 'editor', 'viewer']), topicController.getTopic);
router.put('/topics/:id', authorize(['admin', 'editor']), topicController.updateTopic);
router.delete('/topics/:id', authorize(['admin', 'editor']), topicController.deleteTopic);

// User management routes (admin only)
router.get('/users', authorize(['admin']), userController.getUsers);
router.post('/users', authorize(['admin']), userController.createUser);
router.get('/users/:id', authorize(['admin']), userController.getUser);
router.put('/users/:id', authorize(['admin']), userController.updateUser);
router.delete('/users/:id', authorize(['admin']), userController.deleteUser);

module.exports = router;