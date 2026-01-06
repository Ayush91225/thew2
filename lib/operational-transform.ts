// Operational Transformation for Real-Time Collaboration
// This implements basic OT for conflict-free text synchronization

export interface Operation {
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  userId?: string
  timestamp?: number
}

export class OperationalTransform {
  // Transform operation against another operation
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2)
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2)
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      const [op2Prime, op1Prime] = this.transformInsertDelete(op2, op1)
      return [op1Prime, op2Prime]
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2)
    }
    
    return [op1, op2] // No transformation needed
  }

  private static transformInsertInsert(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.position <= op2.position) {
      return [
        op1,
        { ...op2, position: op2.position + (op1.content?.length || 0) }
      ]
    } else {
      return [
        { ...op1, position: op1.position + (op2.content?.length || 0) },
        op2
      ]
    }
  }

  private static transformInsertDelete(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.position <= op2.position) {
      return [
        op1,
        { ...op2, position: op2.position + (op1.content?.length || 0) }
      ]
    } else if (op1.position >= op2.position + (op2.length || 0)) {
      return [
        { ...op1, position: op1.position - (op2.length || 0) },
        op2
      ]
    } else {
      // Insert is within delete range
      return [
        { ...op1, position: op2.position },
        { ...op2, length: (op2.length || 0) + (op1.content?.length || 0) }
      ]
    }
  }

  private static transformDeleteDelete(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.position + (op1.length || 0) <= op2.position) {
      return [
        op1,
        { ...op2, position: op2.position - (op1.length || 0) }
      ]
    } else if (op2.position + (op2.length || 0) <= op1.position) {
      return [
        { ...op1, position: op1.position - (op2.length || 0) },
        op2
      ]
    } else {
      // Overlapping deletes - merge them
      const start = Math.min(op1.position, op2.position)
      const end1 = op1.position + (op1.length || 0)
      const end2 = op2.position + (op2.length || 0)
      const end = Math.max(end1, end2)
      
      return [
        { ...op1, position: start, length: end - start },
        { type: 'retain', position: 0, length: 0 } // No-op
      ]
    }
  }

  // Apply operation to text
  static apply(text: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return text.slice(0, operation.position) + 
               (operation.content || '') + 
               text.slice(operation.position)
      
      case 'delete':
        return text.slice(0, operation.position) + 
               text.slice(operation.position + (operation.length || 0))
      
      default:
        return text
    }
  }

  // Compose multiple operations into one
  static compose(ops: Operation[]): Operation[] {
    if (ops.length === 0) return []
    if (ops.length === 1) return ops

    const result: Operation[] = []
    let current = ops[0]

    for (let i = 1; i < ops.length; i++) {
      const next = ops[i]
      
      // Try to merge consecutive operations
      if (this.canMerge(current, next)) {
        current = this.merge(current, next)
      } else {
        result.push(current)
        current = next
      }
    }
    
    result.push(current)
    return result
  }

  private static canMerge(op1: Operation, op2: Operation): boolean {
    if (op1.type !== op2.type) return false
    if (op1.userId !== op2.userId) return false
    
    if (op1.type === 'insert' && op2.type === 'insert') {
      return op1.position + (op1.content?.length || 0) === op2.position
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      return op1.position === op2.position
    }
    
    return false
  }

  private static merge(op1: Operation, op2: Operation): Operation {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return {
        ...op1,
        content: (op1.content || '') + (op2.content || '')
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      return {
        ...op1,
        length: (op1.length || 0) + (op2.length || 0)
      }
    }
    
    return op1
  }
}

// Real-time synchronization manager
export class RealTimeSync {
  private operations: Operation[] = []
  private pendingOperations: Operation[] = []
  private version = 0

  addOperation(operation: Operation): void {
    // Transform against pending operations
    let transformedOp = operation
    
    for (const pending of this.pendingOperations) {
      const [newOp] = OperationalTransform.transform(transformedOp, pending)
      transformedOp = newOp
    }
    
    this.operations.push(transformedOp)
    this.version++
  }

  receiveOperation(operation: Operation): Operation {
    // Transform against our pending operations
    let transformedOp = operation
    
    for (let i = 0; i < this.pendingOperations.length; i++) {
      const [pending, received] = OperationalTransform.transform(
        this.pendingOperations[i], 
        transformedOp
      )
      this.pendingOperations[i] = pending
      transformedOp = received
    }
    
    this.operations.push(transformedOp)
    this.version++
    
    return transformedOp
  }

  confirmOperation(operation: Operation): void {
    // Remove from pending operations
    this.pendingOperations = this.pendingOperations.filter(
      op => op.timestamp !== operation.timestamp
    )
  }

  getVersion(): number {
    return this.version
  }
}