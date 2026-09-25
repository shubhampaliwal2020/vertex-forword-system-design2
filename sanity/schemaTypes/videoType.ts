import {DocumentVideoIcon} from '@sanity/icons/DocumentVideo'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const videoType = defineType({
  name: 'video',
  title: 'Video intelligence',
  type: 'document',
  icon: DocumentVideoIcon,
  fields: [
    defineField({name: 'sourceId', title: 'Source ID', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'url', title: 'Video URL', type: 'url', validation: (Rule) => Rule.required()}),
    defineField({name: 'provider', title: 'Provider', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'durationSeconds', title: 'Duration (seconds)', type: 'number'}),
    defineField({
      name: 'chapters',
      title: 'Chapters',
      type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'startSeconds', title: 'Start seconds', type: 'number', validation: (Rule) => Rule.required().min(0)}),
        defineField({name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required()}),
      ]})],
    }),
    defineField({
      name: 'chunks',
      title: 'Transcript chunks',
      type: 'array',
      of: [defineArrayMember({type: 'object', fields: [
        defineField({name: 'startSeconds', title: 'Start seconds', type: 'number', validation: (Rule) => Rule.required().min(0)}),
        defineField({name: 'text', title: 'Text', type: 'text', validation: (Rule) => Rule.required()}),
      ]})],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {select: {title: 'sourceId', subtitle: 'url'}},
})