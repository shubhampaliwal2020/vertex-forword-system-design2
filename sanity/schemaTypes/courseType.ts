import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const courseType = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      options: {
        list: ['Beginner', 'Intermediate', 'Advanced'],
      },
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'string',
      description: 'Display value such as Free or $49',
    }),
    defineField({
      name: 'popular',
      title: 'Popular',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student count',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'learningOutcomes',
      title: 'Learning outcomes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              description: 'Single-character or short icon token for display',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'description',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'reference',
      to: [{type: 'instructor'}],
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [{type: 'module'}],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category.title',
      media: 'coverImage',
    },
  },
})
