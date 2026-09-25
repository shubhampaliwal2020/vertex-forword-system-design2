import { type SchemaTypeDefinition } from 'sanity'

import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {courseType} from './courseType'
import {instructorType} from './instructorType'
import {lessonType} from './lessonType'
import {moduleType} from './moduleType'
import {postType} from './postType'
import {authorType} from './authorType'
import {videoType} from './videoType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
    categoryType,
    courseType,
    instructorType,
    lessonType,
    moduleType,
    postType,
    authorType,
    videoType,
  ],
}
