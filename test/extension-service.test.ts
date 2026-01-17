// Test script for extension service
import { extensionService } from '../lib/extension-service'

async function testExtensionService() {
  console.log('Testing Extension Service...')
  
  try {
    // Test search extensions
    console.log('1. Testing search extensions...')
    const searchResult = await extensionService.searchExtensions({
      query: 'prettier',
      category: 'All',
      sort: 'downloads'
    })
    console.log('Search result:', searchResult.success ? 'SUCCESS' : 'FAILED')
    console.log('Extensions found:', searchResult.extensions.length)
    
    // Test install extension
    console.log('2. Testing install extension...')
    const installResult = await extensionService.installExtension('prettier')
    console.log('Install result:', installResult.success ? 'SUCCESS' : 'FAILED')
    console.log('Message:', installResult.message)
    
    // Test enable extension
    console.log('3. Testing enable extension...')
    const enableResult = await extensionService.enableExtension('prettier')
    console.log('Enable result:', enableResult.success ? 'SUCCESS' : 'FAILED')
    
    // Test disable extension
    console.log('4. Testing disable extension...')
    const disableResult = await extensionService.disableExtension('prettier')
    console.log('Disable result:', disableResult.success ? 'SUCCESS' : 'FAILED')
    
    // Test update extension
    console.log('5. Testing update extension...')
    const updateResult = await extensionService.updateExtension('prettier')
    console.log('Update result:', updateResult.success ? 'SUCCESS' : 'FAILED')
    
    // Test uninstall extension
    console.log('6. Testing uninstall extension...')
    const uninstallResult = await extensionService.uninstallExtension('prettier')
    console.log('Uninstall result:', uninstallResult.success ? 'SUCCESS' : 'FAILED')
    
    // Test get categories
    console.log('7. Testing get categories...')
    const categories = await extensionService.getCategories()
    console.log('Categories:', categories)
    
    console.log('\\n✅ All extension service tests completed!')
    
  } catch (error) {
    console.error('❌ Extension service test failed:', error)
  }
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  (window as any).testExtensionService = testExtensionService
}

export { testExtensionService }