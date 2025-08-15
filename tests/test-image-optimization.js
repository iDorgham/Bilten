/**
 * Test script for Image Optimization Service
 * Demonstrates the optional image optimization job functionality
 */

const ImageOptimizationService = require('./src/services/imageOptimizationService');
const ImageStorageService = require('./src/services/ImageStorageService');

// Mock storage service for testing
class MockStorageService {
  constructor() {
    this.files = new Map();
  }

  async uploadImage(file, metadata = {}) {
    const key = `test/${Date.now()}-${file.originalname}`;
    this.files.set(key, { ...file, metadata });
    
    return {
      url: `https://mock-s3.amazonaws.com/${key}`,
      key: key,
      size: file.size,
      mimetype: file.mimetype,
      metadata: metadata
    };
  }

  async downloadImage(keyOrUrl) {
    const key = keyOrUrl.includes('http') ? keyOrUrl.split('/').pop() : keyOrUrl;
    const file = this.files.get(key);
    
    if (!file) {
      throw new Error('File not found');
    }
    
    return {
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
      metadata: file.metadata
    };
  }

  async healthCheck() {
    return { status: 'healthy', provider: 'mock' };
  }
}

async function testImageOptimization() {
  console.log('🧪 Testing Image Optimization Service...\n');

  // Initialize services
  const storageService = new MockStorageService();
  const optimizationService = new ImageOptimizationService({
    enabled: true,
    maxConcurrentJobs: 3,
    defaultQuality: 80,
    storageService
  });

  // Set up event listeners
  optimizationService.on('job:queued', (job) => {
    console.log(`📋 Job queued: ${job.id} for image: ${job.imageKey}`);
  });

  optimizationService.on('job:started', (job) => {
    console.log(`▶️  Job started: ${job.id}`);
  });

  optimizationService.on('job:completed', (job) => {
    console.log(`✅ Job completed: ${job.id}`);
    console.log(`   Results:`, Object.keys(job.results));
    console.log(`   Duration: ${job.completedAt - job.startedAt}ms`);
  });

  optimizationService.on('job:failed', (job, error) => {
    console.log(`❌ Job failed: ${job.id} - ${error.message}`);
  });

  // Create a mock image
  const mockImageBuffer = Buffer.alloc(1024 * 1024); // 1MB mock image
  const mockImage = {
    buffer: mockImageBuffer,
    originalname: 'test-image.jpg',
    mimetype: 'image/jpeg',
    size: mockImageBuffer.length
  };

  // Upload mock image
  console.log('📤 Uploading mock image...');
  const uploadResult = await storageService.uploadImage(mockImage, {
    originalName: 'test-image.jpg',
    uploadedBy: 'test-user'
  });
  console.log(`   Uploaded: ${uploadResult.key}\n`);

  // Test 1: Single optimization job
  console.log('🔧 Test 1: Single optimization job');
  try {
    const job = await optimizationService.addOptimizationJob(uploadResult.key, {
      profiles: ['thumbnail', 'small', 'medium'],
      quality: 85,
      format: 'webp'
    });

    console.log(`   Job ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Profiles: ${job.options.profiles.join(', ')}\n`);

    // Wait for job to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const jobStatus = optimizationService.getJobStatus(job.id);
    console.log(`   Final status: ${jobStatus.status}`);
    if (jobStatus.results) {
      console.log(`   Optimized versions: ${Object.keys(jobStatus.results).length}`);
    }
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Batch optimization jobs
  console.log('🔧 Test 2: Batch optimization jobs');
  try {
    const batchJobs = [];
    for (let i = 1; i <= 3; i++) {
      const mockImage = {
        buffer: Buffer.alloc(512 * 1024), // 512KB mock image
        originalname: `batch-test-${i}.png`,
        mimetype: 'image/png',
        size: 512 * 1024
      };

      const uploadResult = await storageService.uploadImage(mockImage);
      batchJobs.push(uploadResult.key);
    }

    console.log(`   Created ${batchJobs.length} test images`);

    // Add optimization jobs for all images
    const jobs = [];
    for (const imageKey of batchJobs) {
      const job = await optimizationService.addOptimizationJob(imageKey, {
        profiles: ['thumbnail', 'small'],
        quality: 90,
        format: 'webp'
      });
      jobs.push(job);
    }

    console.log(`   Created ${jobs.length} optimization jobs`);

    // Wait for jobs to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check final status
    for (const job of jobs) {
      const status = optimizationService.getJobStatus(job.id);
      console.log(`   Job ${job.id}: ${status.status}`);
    }
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Queue status and metrics
  console.log('🔧 Test 3: Queue status and metrics');
  try {
    const queueStatus = optimizationService.getQueueStatus();
    console.log('   Queue Status:');
    console.log(`     Queue length: ${queueStatus.queueLength}`);
    console.log(`     Active jobs: ${queueStatus.activeJobs}`);
    console.log(`     Max concurrent: ${queueStatus.maxConcurrentJobs}`);
    console.log(`     Is processing: ${queueStatus.isProcessing}`);
    console.log(`     Jobs processed: ${queueStatus.metrics.jobsProcessed}`);
    console.log(`     Jobs failed: ${queueStatus.metrics.jobsFailed}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Service health check
  console.log('🔧 Test 4: Service health check');
  try {
    const health = await optimizationService.healthCheck();
    console.log('   Health Check:');
    console.log(`     Status: ${health.status}`);
    console.log(`     Enabled: ${health.enabled}`);
    console.log(`     Queue length: ${health.queueStatus.queueLength}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Toggle service
  console.log('🔧 Test 5: Toggle service');
  try {
    console.log(`   Current enabled state: ${optimizationService.config.enabled}`);
    
    optimizationService.setEnabled(false);
    console.log(`   Disabled service`);
    
    try {
      await optimizationService.addOptimizationJob('test-key');
      console.log(`   ❌ Should have failed - service is disabled`);
    } catch (error) {
      console.log(`   ✅ Correctly rejected job: ${error.message}`);
    }
    
    optimizationService.setEnabled(true);
    console.log(`   Re-enabled service`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n✅ Image Optimization Service tests completed!');
}

// Run tests
if (require.main === module) {
  testImageOptimization().catch(console.error);
}

module.exports = { testImageOptimization };
