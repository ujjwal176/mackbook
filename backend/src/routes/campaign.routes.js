const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getAllCampaigns, getCampaignById, createCampaign } = require('../controllers/campaign.controller');

router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);
router.post('/', auth, upload.single('image'), createCampaign);

module.exports = router;
