import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const AlbumForm = () => {
  const [albumData, setAlbumData] = useState({
    artwork_gallery: [],
    album_name: '',
    album_type: 'EP',
    album_artist: 'Yegge',
    catalog_no: '',
    upc: '',
    distributor: '',
    label: '',
    release_date: null,
    removal_date: null
  });

  const handleChange = (e) => {
    setAlbumData({
      ...albumData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('albums').insert([albumData]);
    if (error) {
      console.error(error);
      alert('Error inserting album');
    } else {
      setAlbumData({
        artwork_gallery: [],
        album_name: '',
        album_type: 'EP',
        album_artist: 'Yegge',
        catalog_no: '',
        upc: '',
        distributor: '',
        label: '',
        release_date: null,
        removal_date: null
      });
      alert('Album inserted successfully');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Album</h2>
      <div>
        <label htmlFor="artwork_gallery">Artwork Gallery:</label>
        <input
          type="text"
          id="artwork_gallery"
          name="artwork_gallery"
          value={albumData.artwork_gallery}
          onChange={handleChange}
          placeholder="e.g., https://example.com/album1.jpg"
          required
        />
      </div>
      <div>
        <label htmlFor="album_name">Album Name:</label>
        <input
          type="text"
          id="album_name"
          name="album_name"
          value={albumData.album_name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="album_type">Album Type:</label>
        <select
          id="album_type"
          name="album_type"
          value={albumData.album_type}
          onChange={handleChange}
          required
        >
          <option value="EP">EP</option>
          <option value="LP">LP</option>
          <option value="SP">SP</option>
          <option value="Compilation">Compilation</option>
        </select>
      </div>
      <div>
        <label htmlFor="album_artist">Album Artist:</label>
        <select
          id="album_artist"
          name="album_artist"
          value={albumData.album_artist}
          onChange={handleChange}
          required
        >
          <option value="Yegge">Yegge</option>
          {/* Add other artists here */}
        </select>
      </div>
      <div>
        <label htmlFor="catalog_no">Catalog No:</label>
        <input
          type="text"
          id="catalog_no"
          name="catalog_no"
          value={albumData.catalog_no}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="upc">UPC:</label>
        <input
          type="text"
          id="upc"
          name="upc"
          value={albumData.upc}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="distributor">Distributor:</label>
        <input
          type="text"
          id="distributor"
          name="distributor"
          value={albumData.distributor}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="label">Label:</label>
        <input
          type="text"
          id="label"
          name="label"
          value={albumData.label}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="release_date">Release Date:</label>
        <input
          type="date"
          id="release_date"
          name="release_date"
          value={albumData.release_date}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="removal_date">Removal Date:</label>
        <input
          type="date"
          id="removal_date"
          name="removal_date"
          value={albumData.removal_date}
          onChange={handleChange}
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default AlbumForm;
