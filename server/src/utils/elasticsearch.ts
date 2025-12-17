import { Client } from '@elastic/elasticsearch';

// Initialize ElasticSearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_API_KEY
    ? {
        apiKey: process.env.ELASTICSEARCH_API_KEY
      }
    : undefined
});

const INDEX_NAME = 'notes';

export interface SearchResult {
  noteId: string;
  title: string;
  description: string;
  subject: string;
  semester: string;
  module: string;
  branch: string;
  uploaderName: string;
  score: number;
}

/**
 * Initialize ElasticSearch index
 */
export const initializeIndex = async (): Promise<void> => {
  try {
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });

    if (!indexExists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            noteId: { type: 'keyword' },
            title: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            subject: { type: 'keyword' },
            semester: { type: 'keyword' },
            module: { type: 'keyword' },
            branch: { type: 'keyword' },
            uploaderName: { type: 'text' },
            tags: { type: 'keyword' },
            uploadDate: { type: 'date' }
          }
        }
      });
      console.log('ElasticSearch index created successfully');
    }
  } catch (error) {
    console.error('ElasticSearch initialization error:', error);
  }
};

/**
 * Index a note in ElasticSearch
 */
export const indexNote = async (note: any): Promise<void> => {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: note._id.toString(),
      document: {
        noteId: note._id.toString(),
        title: note.title,
        description: note.description || '',
        subject: note.subject,
        semester: note.semester,
        module: note.module,
        branch: note.branch,
        uploaderName: note.uploaderName,
        tags: [...note.tags, ...note.aiTags],
        uploadDate: note.uploadDate
      }
    });
  } catch (error) {
    console.error('ElasticSearch indexing error:', error);
  }
};

/**
 * Update indexed note
 */
export const updateIndexedNote = async (noteId: string, updates: any): Promise<void> => {
  try {
    await esClient.update({
      index: INDEX_NAME,
      id: noteId,
      doc: updates
    });
  } catch (error) {
    console.error('ElasticSearch update error:', error);
  }
};

/**
 * Delete note from index
 */
export const deleteIndexedNote = async (noteId: string): Promise<void> => {
  try {
    await esClient.delete({
      index: INDEX_NAME,
      id: noteId
    });
  } catch (error) {
    console.error('ElasticSearch delete error:', error);
  }
};

/**
 * Search notes
 */
export const searchNotes = async (
  query: string,
  filters?: {
    subject?: string;
    semester?: string;
    module?: string;
    branch?: string;
  },
  limit: number = 20
): Promise<SearchResult[]> => {
  try {
    const mustClauses: any[] = [];

    // Add search query
    if (query && query.trim().length > 0) {
      mustClauses.push({
        multi_match: {
          query: query,
          fields: ['title^3', 'description^2', 'tags', 'uploaderName'],
          fuzziness: 'AUTO'
        }
      });
    }

    // Add filters
    if (filters?.subject) {
      mustClauses.push({ term: { subject: filters.subject } });
    }
    if (filters?.semester) {
      mustClauses.push({ term: { semester: filters.semester } });
    }
    if (filters?.module) {
      mustClauses.push({ term: { module: filters.module } });
    }
    if (filters?.branch) {
      mustClauses.push({ term: { branch: filters.branch } });
    }

    const response = await esClient.search({
      index: INDEX_NAME,
      query: {
        bool: {
          must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }]
        }
      },
      size: limit,
      sort: [{ _score: { order: 'desc' } }, { uploadDate: { order: 'desc' } }]
    });

    return response.hits.hits.map((hit: any) => ({
      ...hit._source,
      score: hit._score
    }));
  } catch (error) {
    console.error('ElasticSearch search error:', error);
    return [];
  }
};

/**
 * Get search suggestions (autocomplete)
 */
export const getSearchSuggestions = async (
  prefix: string,
  limit: number = 5
): Promise<string[]> => {
  try {
    const response = await esClient.search({
      index: INDEX_NAME,
      suggest: {
        title_suggest: {
          prefix: prefix,
          completion: {
            field: 'title',
            size: limit,
            skip_duplicates: true
          }
        }
      }
    });

    const suggestions = response.suggest?.title_suggest?.[0]?.options || [];
    return Array.isArray(suggestions) ? suggestions.map((opt: any) => opt.text) : [];
  } catch (error) {
    console.error('ElasticSearch suggestions error:', error);
    return [];
  }
};
